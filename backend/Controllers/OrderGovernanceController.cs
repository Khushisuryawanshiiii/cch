using backend.Contracts.OrderGovernance;
using backend.Data;
using backend.Entities;
using backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace backend.Controllers;

[ApiController]
[Route("api/order-governance")]
[Authorize]
public class OrderGovernanceController(AppDbContext dbContext, IWebHostEnvironment hostEnvironment) : ControllerBase
{
    private const long MaxDocumentSizeBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly HashSet<string> AllowedDocumentExtensions =
    [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".gif", ".webp"
    ];
    private static readonly Dictionary<string, decimal> CurrencyRates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["INR"] = 1m,
        ["USD"] = 83m,
        ["EUR"] = 90m,
        ["GBP"] = 105m
    };

    private static readonly string[] DefaultApprovals = ["Finance", "Legal", "BusinessHead", "SCM", "ServiceDelivery", "PreSales"];

    /// <summary>Maps deal approval <c>RoleKey</c> to the JWT permission claim required to call the decision API for that lane.</summary>
    private static readonly IReadOnlyDictionary<string, string> LaneRoleKeyToPermission =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Finance"] = "order-governance.deal.review_finance",
            ["Legal"] = "order-governance.deal.review_legal",
            ["BusinessHead"] = "order-governance.deal.review_business_head",
            ["SCM"] = "order-governance.deal.review_scm",
            ["ServiceDelivery"] = "order-governance.deal.review_service_delivery",
            ["PreSales"] = "order-governance.deal.review_pre_sales",
        };

    [HttpGet("ping")]
    public ActionResult Ping()
    {
        return Ok(new { module = "order-governance", status = "ready" });
    }

    [HttpGet("deals")]
    public async Task<ActionResult> GetDeals()
    {
        var deals = await dbContext.OrderGovernanceDeals
            .Include(d => d.Approvals)
            .Include(d => d.History)
            .Include(d => d.VersionHistory)
            .Include(d => d.Documents)
            .OrderByDescending(d => d.UpdatedAtUtc)
            .ToArrayAsync();

        return Ok(deals.Select(MapDeal));
    }

    [HttpPost("deals")]
    [HasPermission("order-governance.deal.ingest_excel")]
    public async Task<ActionResult> CreateDeal([FromBody] CreateDealRequest request)
    {
        var actor = GetActorRole();
        var deal = new OrderGovernanceDeal
        {
            OpportunityNumber = request.OpportunityNumber.Trim(),
            AccountName = request.AccountName.Trim(),
            OpportunityName = request.OpportunityName.Trim(),
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "INR" : request.Currency.Trim(),
            Stage = request.Stage.Trim(),
            OpportunityOwner = request.OpportunityOwner.Trim(),
            AmName = request.AmName.Trim(),
            Manager = (request.Manager ?? string.Empty).Trim(),
            Geo = request.Geo.Trim(),
            DeliveryType = request.DeliveryType.Trim(),
            CloseDate = request.CloseDate.Trim(),
            Status = "Pending Input",
            RequiredApprovalsCsv = string.Join(",", DefaultApprovals)
        };

        foreach (var role in DefaultApprovals)
        {
            deal.Approvals.Add(new OrderGovernanceApproval { RoleKey = role, Status = "Pending" });
        }
        LogHistory(deal, "created", actor, $"Deal created for opportunity {deal.OpportunityNumber}");
        LogVersionHistory(deal, actor, "Initial deal created");

        dbContext.OrderGovernanceDeals.Add(deal);
        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpDelete("deals/{dealId:guid}")]
    [HasPermission("order-governance.deal.ingest_excel")]
    public async Task<ActionResult> DeleteDeal(Guid dealId)
    {
        var deal = await dbContext.OrderGovernanceDeals.FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        var canDelete = string.Equals(deal.Status, "Pending Input", StringComparison.OrdinalIgnoreCase)
            || string.Equals(deal.Status, "Below Threshold", StringComparison.OrdinalIgnoreCase);
        if (!canDelete)
        {
            return BadRequest("Only draft (Pending Input) or Below Threshold imports can be deleted.");
        }

        dbContext.OrderGovernanceDeals.Remove(deal);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    // TEMP: Test-data reset utility. Wipes only the Order Governance
    // transactional + audit tables (deals, approvals, history, version
    // history) so the Excel upload flow can be re-run from a clean slate.
    // Users / Roles / Permissions (reference data) are intentionally NOT
    // touched — otherwise RBAC would break and the caller would lock
    // themselves out. Remove this endpoint before any production release.
    [HttpPost("admin/reset-test-data")]
    [HasPermission("order-governance.deal.ingest_excel")]
    public async Task<ActionResult> ResetTestData([FromBody] ResetTestDataRequest? request)
    {
        // Hard environment gate — the endpoint is a 404 in any non-Development
        // environment even if somebody accidentally deploys it.
        if (!hostEnvironment.IsDevelopment())
        {
            return NotFound();
        }

        // Typed-phrase guard mirrors the frontend prompt; belt-and-braces so
        // even a crafted cURL cannot wipe data without the confirmation token.
        var confirmation = request?.Confirmation?.Trim();
        if (!string.Equals(confirmation, "RESET", StringComparison.Ordinal))
        {
            return BadRequest("Confirmation phrase must be exactly 'RESET'.");
        }

        var actor = GetActorRole();

        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        try
        {
            // Delete children first for clarity, even though the FKs have
            // DeleteBehavior.Cascade configured. ExecuteDeleteAsync issues a
            // single DELETE per table without loading rows into memory.
            var historyDeleted = await dbContext.OrderGovernanceHistory.ExecuteDeleteAsync();
            var versionHistoryDeleted = await dbContext.OrderGovernanceVersionHistory.ExecuteDeleteAsync();
            var approvalsDeleted = await dbContext.OrderGovernanceApprovals.ExecuteDeleteAsync();
            var dealsDeleted = await dbContext.OrderGovernanceDeals.ExecuteDeleteAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                resetBy = actor,
                resetAtUtc = DateTime.UtcNow,
                deletedCounts = new
                {
                    deals = dealsDeleted,
                    approvals = approvalsDeleted,
                    history = historyDeleted,
                    versionHistory = versionHistoryDeleted
                }
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [HttpPost("deals/ingest")]
    [HasPermission("order-governance.deal.ingest_excel")]
    public async Task<ActionResult> IngestDeals([FromBody] IngestDealsRequest request)
    {
        var actor = GetActorRole();
        var created = new List<OrderGovernanceDeal>();
        var rows = request.Rows ?? [];

        foreach (var row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.OpportunityName) || string.IsNullOrWhiteSpace(row.OpportunityNumber))
            {
                continue;
            }

            if ((row.Stage?.Contains("Closed Lost", StringComparison.OrdinalIgnoreCase) ?? false))
            {
                continue;
            }

            var inr = ConvertToInr(row.Amount, row.Currency);
            var belowThreshold = inr < request.ThresholdInr;

            var existing = await dbContext.OrderGovernanceDeals
                .Include(d => d.Approvals)
                .Include(d => d.History)
                .Include(d => d.VersionHistory)
                .FirstOrDefaultAsync(d => d.OpportunityNumber == row.OpportunityNumber);

            if (existing is null)
            {
                var deal = new OrderGovernanceDeal
                {
                    OpportunityNumber = row.OpportunityNumber.Trim(),
                    AccountName = row.AccountName?.Trim() ?? string.Empty,
                    OpportunityName = row.OpportunityName.Trim(),
                    Amount = row.Amount,
                    Currency = string.IsNullOrWhiteSpace(row.Currency) ? "INR" : row.Currency.Trim(),
                    Stage = row.Stage?.Trim() ?? string.Empty,
                    OpportunityOwner = row.OpportunityOwner?.Trim() ?? string.Empty,
                    AmName = row.AmName?.Trim() ?? string.Empty,
                    Manager = row.Manager?.Trim() ?? string.Empty,
                    Geo = row.Geo?.Trim() ?? string.Empty,
                    DeliveryType = row.DeliveryType?.Trim() ?? string.Empty,
                    CloseDate = row.CloseDate?.Trim() ?? string.Empty,
                    Status = belowThreshold ? "Below Threshold" : "Pending Input",
                    RequiredApprovalsCsv = string.Join(",", DefaultApprovals)
                };

                foreach (var role in DefaultApprovals)
                {
                    deal.Approvals.Add(new OrderGovernanceApproval { RoleKey = role, Status = "Pending" });
                }

                LogHistory(deal, "ingested", actor, $"Ingested from Excel. Amount {deal.Currency} {deal.Amount}");
                LogVersionHistory(deal, actor, "Initial Excel upload");
                dbContext.OrderGovernanceDeals.Add(deal);
                created.Add(deal);
            }
            else if (!string.Equals(existing.Status, "Completed", StringComparison.OrdinalIgnoreCase))
            {
                var majorChanges = new List<string>();
                var metadataChanges = new List<string>();
                TrackChange(existing.AccountName, row.AccountName, "Account", majorChanges, metadataChanges);
                TrackChange(existing.OpportunityName, row.OpportunityName, "Opportunity", majorChanges, metadataChanges);
                TrackNumericChange(existing.Amount, row.Amount, "Amount", majorChanges);
                TrackChange(existing.Currency, row.Currency, "Currency", majorChanges, metadataChanges);
                TrackChange(existing.Stage, row.Stage, "Stage", majorChanges, metadataChanges);
                TrackChange(existing.OpportunityOwner, row.OpportunityOwner, "Owner", majorChanges, metadataChanges);
                TrackChange(existing.Geo, row.Geo, "Geo", majorChanges, metadataChanges);
                TrackChange(existing.AmName, row.AmName, "AM Name", majorChanges, metadataChanges);
                TrackChange(existing.Manager, row.Manager, "Manager", majorChanges, metadataChanges);
                TrackChange(existing.DeliveryType, row.DeliveryType, "Delivery Type", majorChanges, metadataChanges);
                TrackChange(existing.CloseDate, row.CloseDate, "Close Date", majorChanges, metadataChanges);

                existing.AccountName = (row.AccountName ?? existing.AccountName).Trim();
                existing.OpportunityName = row.OpportunityName.Trim();
                existing.Amount = row.Amount;
                existing.Currency = string.IsNullOrWhiteSpace(row.Currency) ? existing.Currency : row.Currency.Trim();
                existing.Stage = (row.Stage ?? existing.Stage).Trim();
                existing.OpportunityOwner = (row.OpportunityOwner ?? existing.OpportunityOwner).Trim();
                existing.AmName = (row.AmName ?? existing.AmName).Trim();
                existing.Manager = (row.Manager ?? existing.Manager).Trim();
                existing.Geo = (row.Geo ?? existing.Geo).Trim();
                existing.DeliveryType = (row.DeliveryType ?? existing.DeliveryType).Trim();
                existing.CloseDate = (row.CloseDate ?? existing.CloseDate).Trim();
                if (!string.Equals(existing.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                {
                    existing.Status = belowThreshold ? "Below Threshold" : existing.Status;
                }

                if (majorChanges.Count > 0)
                {
                    existing.Version += 1;
                    LogVersionHistory(existing, actor, string.Join("; ", majorChanges));
                    LogHistory(existing, "excel-update", actor, string.Join("; ", majorChanges));
                }
                else if (metadataChanges.Count > 0)
                {
                    LogHistory(existing, "excel-metadata-sync", actor, string.Join("; ", metadataChanges));
                }
            }
        }

        await dbContext.SaveChangesAsync();
        return Ok(new
        {
            createdCount = created.Count,
            totalTracked = await dbContext.OrderGovernanceDeals.CountAsync()
        });
    }

    [HttpPut("deals/{dealId:guid}/enrich")]
    [HasPermission("order-governance.deal.enrich")]
    public async Task<ActionResult> EnrichDeal(Guid dealId, [FromBody] EnrichDealRequest request)
    {
        var deal = await dbContext.OrderGovernanceDeals.FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (!string.Equals(deal.Status, "Pending Input", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only Pending Input deals can be enriched.");
        }

        deal.ProductValue = request.ProductValue;
        deal.ServiceValue = request.ServiceValue;
        deal.AmcValue = request.AmcValue;
        deal.OthersValue = request.OthersValue;
        deal.ProductCost = request.ProductCost;
        deal.ExternalServiceCost = request.ExternalServiceCost;
        deal.InternalCost = request.InternalCost;
        deal.OthersCost = request.OthersCost;
        deal.CustomerPaymentTerm = (request.CustomerPaymentTerm ?? string.Empty).Trim();
        deal.VendorPaymentTerm = (request.VendorPaymentTerm ?? string.Empty).Trim();

        if (!string.IsNullOrWhiteSpace(request.Stage))
        {
            var newStage = request.Stage.Trim();
            if (!string.Equals(deal.Stage, newStage, StringComparison.OrdinalIgnoreCase))
            {
                var oldStage = string.IsNullOrWhiteSpace(deal.Stage) ? "—" : deal.Stage;
                deal.Stage = newStage;
                LogHistory(deal, "stage-update", GetActorRole(), $"Stage: {oldStage} -> {newStage}");
            }
        }

        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "enriched", GetActorRole(), "Sales enrichment updated bid/cost/payment fields");

        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpPost("deals/{dealId:guid}/submit")]
    [HasPermission("order-governance.deal.submit")]
    public async Task<ActionResult> SubmitDeal(Guid dealId)
    {
        var deal = await dbContext.OrderGovernanceDeals.FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (!string.Equals(deal.Status, "Pending Input", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only Pending Input deals can be submitted.");
        }

        deal.Status = "Pending Review";
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "submitted", GetActorRole(), "Submitted to reviewer triage queue");
        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpPost("deals/{dealId:guid}/reviewer-route")]
    [HasPermission("order-governance.route.configure")]
    public async Task<ActionResult> ReviewerRoute(Guid dealId, [FromBody] ReviewerRouteRequest request)
    {
        var deal = await dbContext.OrderGovernanceDeals.Include(d => d.Approvals).FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (!string.Equals(deal.Status, "Pending Review", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(deal.Status, "Level Skipped", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Deal must be in Pending Review to route approvals.");
        }

        var required = request.RequiredApprovals?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct().ToArray() ?? [];
        if (required.Length == 0) return BadRequest("At least one required approver is needed.");
        var previousRequiredCsv = deal.RequiredApprovalsCsv ?? string.Empty;

        // Step 1+2: persist any reviewer corrections to bid / cost / payment / stage
        // values and let the deal's stored numbers drive the margin recalculation.
        ApplyReviewerEnrichment(deal, request);

        deal.RequiredApprovalsCsv = string.Join(",", required);
        deal.Status = "In Approval";
        deal.UpdatedAtUtc = DateTime.UtcNow;

        var now = DateTime.UtcNow;
        var requiredSet = required.ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var approval in deal.Approvals)
        {
            // Only "start the clock" for the approver roles the reviewer explicitly
            // marked as required. Optional/unselected roles stay dormant.
            if (requiredSet.Contains(approval.RoleKey))
            {
                approval.Status = "Pending";
                approval.Comments = string.Empty;
                approval.CreatedDateUtc = now;
                approval.ActionDateUtc = null;
            }
            else
            {
                approval.Status = "Not Required";
                approval.Comments = string.Empty;
                approval.CreatedDateUtc = null;
                approval.ActionDateUtc = null;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ReviewerComments))
        {
            var reviewerApproval = deal.Approvals.FirstOrDefault(a => a.RoleKey == "Reviewer");
            if (reviewerApproval is null)
            {
                // Add through the DbSet so EF unambiguously marks this as Added.
                // Adding via deal.Approvals.Add(...) makes EF inspect the
                // client-generated Guid key and (incorrectly) classify the row as
                // Modified, which then issues an UPDATE that matches 0 rows and
                // surfaces as DbUpdateConcurrencyException at SaveChangesAsync.
                var entry = new OrderGovernanceApproval
                {
                    DealId = deal.Id,
                    RoleKey = "Reviewer",
                    Status = "Approved",
                    Comments = request.ReviewerComments.Trim(),
                    CreatedDateUtc = now,
                    ActionDateUtc = now
                };
                dbContext.OrderGovernanceApprovals.Add(entry);
                deal.Approvals.Add(entry);
            }
            else
            {
                reviewerApproval.Status = "Approved";
                reviewerApproval.Comments = request.ReviewerComments.Trim();
                reviewerApproval.CreatedDateUtc = now;
                reviewerApproval.ActionDateUtc = now;
            }
        }
        if (!string.Equals(previousRequiredCsv, deal.RequiredApprovalsCsv, StringComparison.OrdinalIgnoreCase))
        {
            BumpVersion(deal, "Approval route changed by reviewer");
        }
        LogHistory(deal, "routed", GetActorRole(), $"Required approvals set: {string.Join(", ", required)}");

        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpPost("deals/{dealId:guid}/return-to-sales")]
    [HasPermission("order-governance.deal.return_to_sales")]
    public async Task<ActionResult> ReturnToSales(Guid dealId)
    {
        var deal = await dbContext.OrderGovernanceDeals.Include(d => d.Approvals).FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");

        deal.Status = "Pending Input";
        deal.UpdatedAtUtc = DateTime.UtcNow;
        foreach (var approval in deal.Approvals)
        {
            approval.Status = "Pending";
            approval.Comments = string.Empty;
            approval.CreatedDateUtc = null;
            approval.ActionDateUtc = null;
        }
        BumpVersion(deal, "Returned to Sales for correction");
        LogHistory(deal, "returned", GetActorRole(), "Returned to sales for correction");

        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpPost("deals/{dealId:guid}/approvals/{roleKey}/decision")]
    public async Task<ActionResult> ApproverDecision(Guid dealId, string roleKey, [FromBody] ApprovalDecisionRequest request)
    {
        var deal = await dbContext.OrderGovernanceDeals.Include(d => d.Approvals).FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (!string.Equals(deal.Status, "In Approval", StringComparison.OrdinalIgnoreCase)) return BadRequest("Deal is not in approval.");

        if (!LaneRoleKeyToPermission.TryGetValue(roleKey, out var requiredPermission) ||
            !UserHasPermission(requiredPermission))
        {
            return Forbid();
        }

        var requiredRoles = ParseRequiredApprovals(deal.RequiredApprovalsCsv);
        if (!requiredRoles.Any(r => string.Equals(r, roleKey, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest("This approval lane is not required for this deal.");
        }

        var decision = request.Decision.Trim().ToLowerInvariant();
        if (decision is not ("approve" or "reject")) return BadRequest("Decision must be approve or reject.");

        // Comments are mandatory: every Finance / Legal / SCM / Business Head /
        // PreSales / Service Delivery decision must be justified in writing so
        // that the Approval Chain table tells a complete story.
        var trimmedComments = (request.Comments ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmedComments))
        {
            return BadRequest("A comment is required to approve or reject a deal.");
        }

        var approval = deal.Approvals.FirstOrDefault(a => string.Equals(a.RoleKey, roleKey, StringComparison.OrdinalIgnoreCase));
        if (approval is null) return NotFound("Approver role not configured.");

        if (!string.Equals(approval.Status, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("This lane has already been decided or is not active.");
        }

        approval.Status = decision == "approve" ? "Approved" : "Rejected";
        approval.Comments = trimmedComments;
        approval.ActionDateUtc = DateTime.UtcNow;
        deal.UpdatedAtUtc = DateTime.UtcNow;

        if (approval.Status == "Rejected")
        {
            deal.Status = "Rejected";
            BumpVersion(deal, $"{roleKey} rejected the deal");
        }
        else
        {
            var required = ParseRequiredApprovals(deal.RequiredApprovalsCsv);
            var allApproved = required.All(requiredRole =>
            {
                var reqApproval = deal.Approvals.FirstOrDefault(a => string.Equals(a.RoleKey, requiredRole, StringComparison.OrdinalIgnoreCase));
                return reqApproval is not null && string.Equals(reqApproval.Status, "Approved", StringComparison.OrdinalIgnoreCase);
            });

            if (allApproved)
            {
                deal.Status = "Completed";
                BumpVersion(deal, "All required approvals completed");
            }
        }
        LogHistory(deal, "decision", GetActorRole(), $"{roleKey} marked {approval.Status}. {approval.Comments}".Trim());

        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    /// <summary>
    /// Allows an approver whose lane the reviewer marked as Optional (status
    /// "Not Required") to leave an advisory comment on the deal without
    /// approving or rejecting it. Only the approver who owns the lane
    /// permission can write to that lane.
    /// </summary>
    [HttpPost("deals/{dealId:guid}/approvals/{roleKey}/advisory-comment")]
    public async Task<ActionResult> ApproverAdvisoryComment(Guid dealId, string roleKey, [FromBody] ApprovalCommentRequest request)
    {
        var deal = await dbContext.OrderGovernanceDeals.Include(d => d.Approvals).FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (!string.Equals(deal.Status, "In Approval", StringComparison.OrdinalIgnoreCase)) return BadRequest("Deal is not in approval.");

        if (!LaneRoleKeyToPermission.TryGetValue(roleKey, out var requiredPermission) ||
            !UserHasPermission(requiredPermission))
        {
            return Forbid();
        }

        var approval = deal.Approvals.FirstOrDefault(a => string.Equals(a.RoleKey, roleKey, StringComparison.OrdinalIgnoreCase));
        if (approval is null) return NotFound("Approver role not configured.");

        // Advisory comments are meant for lanes the reviewer explicitly marked
        // Optional. Required lanes must use the decision endpoint; lanes that
        // have already been acted on should not be re-opened for silent edits.
        if (!string.Equals(approval.Status, "Not Required", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Advisory comments are only accepted on Optional (Not Required) lanes.");
        }

        var trimmed = (request.Comments ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return BadRequest("Comment text is required.");
        }

        approval.Comments = trimmed;
        approval.ActionDateUtc = DateTime.UtcNow;
        // Leave approval.Status as "Not Required" so the workflow isn't blocked,
        // but stamp CreatedDateUtc if missing so the Approval Chain table shows
        // when the advisory note was first captured.
        approval.CreatedDateUtc ??= DateTime.UtcNow;
        deal.UpdatedAtUtc = DateTime.UtcNow;

        LogHistory(deal, "advisory-comment", GetActorRole(), $"{roleKey} (optional) left advisory comment: {trimmed}");

        await dbContext.SaveChangesAsync();
        return Ok(MapDeal(deal));
    }

    [HttpPost("deals/{dealId:guid}/cc-confirm")]
    [HasPermission("order-governance.final.confirm_order")]
    public async Task<ActionResult> ConfirmByCc(Guid dealId, [FromBody] CcConfirmRequest request)
    {
        var deal = await dbContext.OrderGovernanceDeals.FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");

        if (!string.Equals(deal.Status, "Completed", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(deal.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("CC confirmation is allowed after approval completion/rejection.");
        }

        deal.ActualPoValue = request.ActualPoValue;
        deal.SapOrder = request.SapOrder.Trim();
        deal.CustomerOrderNo = request.CustomerOrderNo.Trim();
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "cc-confirmed", GetActorRole(), $"CC confirmed with SAP {deal.SapOrder} and Customer Order {deal.CustomerOrderNo}");
        await dbContext.SaveChangesAsync();

        return Ok(MapDeal(deal));
    }

    [HttpGet("deals/{dealId:guid}/documents")]
    public async Task<ActionResult> GetDealDocuments(Guid dealId)
    {
        var dealExists = await dbContext.OrderGovernanceDeals.AnyAsync(d => d.Id == dealId);
        if (!dealExists) return NotFound("Deal not found.");

        var docs = await dbContext.OrderGovernanceDocuments
            .Where(d => d.DealId == dealId)
            .OrderByDescending(d => d.UploadedAtUtc)
            .Select(d => new
            {
                d.Id,
                d.DealId,
                d.OriginalFileName,
                d.ContentType,
                d.FileSizeBytes,
                d.StoragePath,
                d.UploadedBy,
                d.UploadedAtUtc
            })
            .ToArrayAsync();

        return Ok(docs);
    }

    [HttpPost("deals/{dealId:guid}/documents")]
    [HasPermission("order-governance.deal.manage_documents")]
    [RequestSizeLimit(MaxDocumentSizeBytes)]
    public async Task<ActionResult> UploadDealDocument(Guid dealId, IFormFile file)
    {
        var deal = await dbContext.OrderGovernanceDeals
            .Include(d => d.Documents)
            .FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");
        if (file is null || file.Length <= 0) return BadRequest("File is required.");
        if (file.Length > MaxDocumentSizeBytes)
        {
            return BadRequest($"File exceeds the maximum allowed size of {MaxDocumentSizeBytes / (1024 * 1024)} MB.");
        }

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        if (!AllowedDocumentExtensions.Contains(ext))
        {
            return BadRequest("Unsupported file type. Allowed types: PDF, Word, Excel, PNG, JPG, JPEG, GIF, WEBP.");
        }

        var uploadRoot = Path.Combine(hostEnvironment.ContentRootPath, "storage", "order-governance-documents", dealId.ToString("N"));
        Directory.CreateDirectory(uploadRoot);

        var safeOriginalName = SanitizeFileName(Path.GetFileName(file.FileName));
        var storedFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{ext}";
        var absolutePath = Path.Combine(uploadRoot, storedFileName);
        await using (var stream = System.IO.File.Create(absolutePath))
        {
            await file.CopyToAsync(stream);
        }

        var storagePath = Path.Combine("order-governance-documents", dealId.ToString("N"), storedFileName)
            .Replace("\\", "/");

        var doc = new OrderGovernanceDocument
        {
            DealId = dealId,
            OriginalFileName = safeOriginalName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType.Trim(),
            FileSizeBytes = file.Length,
            StoragePath = storagePath,
            UploadedBy = GetActorEmail(),
            UploadedAtUtc = DateTime.UtcNow
        };
        dbContext.OrderGovernanceDocuments.Add(doc);
        deal.Documents.Add(doc);
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "document-uploaded", GetActorRole(), $"Uploaded document: {safeOriginalName} ({file.Length} bytes)");
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            doc.Id,
            doc.DealId,
            doc.OriginalFileName,
            doc.ContentType,
            doc.FileSizeBytes,
            doc.StoragePath,
            doc.UploadedBy,
            doc.UploadedAtUtc
        });
    }

    [HttpGet("deals/{dealId:guid}/documents/{documentId:guid}/download")]
    public async Task<ActionResult> DownloadDealDocument(Guid dealId, Guid documentId)
    {
        var deal = await dbContext.OrderGovernanceDeals
            .Include(d => d.Documents)
            .FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");

        var doc = deal.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc is null) return NotFound("Document not found.");

        var absolutePath = Path.Combine(hostEnvironment.ContentRootPath, "storage", doc.StoragePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(absolutePath))
        {
            return NotFound("Stored document file was not found.");
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(absolutePath);
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "document-downloaded", GetActorRole(), $"Downloaded document: {doc.OriginalFileName}");
        await dbContext.SaveChangesAsync();
        return File(fileBytes, doc.ContentType, doc.OriginalFileName);
    }

    [HttpGet("deals/{dealId:guid}/documents/{documentId:guid}/view")]
    public async Task<ActionResult> ViewDealDocument(Guid dealId, Guid documentId)
    {
        var deal = await dbContext.OrderGovernanceDeals
            .Include(d => d.Documents)
            .FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");

        var doc = deal.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc is null) return NotFound("Document not found.");

        var absolutePath = Path.Combine(hostEnvironment.ContentRootPath, "storage", doc.StoragePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(absolutePath))
        {
            return NotFound("Stored document file was not found.");
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(absolutePath);
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "document-viewed", GetActorRole(), $"Viewed document: {doc.OriginalFileName}");
        await dbContext.SaveChangesAsync();
        // No download file-name hint => browsers can render inline for supported types.
        return File(fileBytes, doc.ContentType);
    }

    [HttpDelete("deals/{dealId:guid}/documents/{documentId:guid}")]
    [HasPermission("order-governance.deal.manage_documents")]
    public async Task<ActionResult> DeleteDealDocument(Guid dealId, Guid documentId)
    {
        var deal = await dbContext.OrderGovernanceDeals
            .Include(d => d.Documents)
            .FirstOrDefaultAsync(d => d.Id == dealId);
        if (deal is null) return NotFound("Deal not found.");

        var doc = deal.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc is null) return NotFound("Document not found.");

        var absolutePath = Path.Combine(hostEnvironment.ContentRootPath, "storage", doc.StoragePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (System.IO.File.Exists(absolutePath))
        {
            System.IO.File.Delete(absolutePath);
        }

        dbContext.OrderGovernanceDocuments.Remove(doc);
        deal.UpdatedAtUtc = DateTime.UtcNow;
        LogHistory(deal, "document-deleted", GetActorRole(), $"Deleted document: {doc.OriginalFileName}");
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("deals/{dealId:guid}/history")]
    public async Task<ActionResult> GetHistory(Guid dealId)
    {
        var history = await dbContext.OrderGovernanceHistory
            .Where(h => h.DealId == dealId)
            .OrderByDescending(h => h.CreatedAtUtc)
            .Select(h => new { h.Id, h.EventType, h.ActorRole, h.Notes, h.CreatedAtUtc })
            .ToArrayAsync();
        return Ok(history);
    }

    private static string[] ParseRequiredApprovals(string csv)
    {
        return string.IsNullOrWhiteSpace(csv)
            ? DefaultApprovals
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }

    private static object MapDeal(OrderGovernanceDeal deal)
    {
        var required = ParseRequiredApprovals(deal.RequiredApprovalsCsv);
        return new
        {
            deal.Id,
            deal.OpportunityNumber,
            deal.AccountName,
            deal.OpportunityName,
            deal.Amount,
            deal.Currency,
            deal.Stage,
            deal.Status,
            deal.OpportunityOwner,
            deal.AmName,
            deal.Manager,
            deal.Geo,
            deal.DeliveryType,
            deal.CloseDate,
            deal.Version,
            deal.ProductValue,
            deal.ServiceValue,
            deal.AmcValue,
            deal.OthersValue,
            deal.ProductCost,
            deal.ExternalServiceCost,
            deal.InternalCost,
            deal.OthersCost,
            deal.CustomerPaymentTerm,
            deal.VendorPaymentTerm,
            deal.ActualPoValue,
            deal.SapOrder,
            deal.CustomerOrderNo,
            RequiredApprovals = required,
            Approvals = deal.Approvals
                .OrderBy(a => a.RoleKey)
                .Select(a => new
                {
                    a.RoleKey,
                    a.Status,
                    a.Comments,
                    a.CreatedDateUtc,
                    a.ActionDateUtc
                })
                .ToArray(),
            History = deal.History
                .OrderByDescending(h => h.CreatedAtUtc)
                .Select(h => new
                {
                    h.Id,
                    h.EventType,
                    h.ActorRole,
                    h.Notes,
                    h.CreatedAtUtc
                })
                .ToArray(),
            VersionHistory = deal.VersionHistory
                .OrderByDescending(v => v.VersionNumber)
                .Select(v => new
                {
                    v.Id,
                    v.VersionNumber,
                    v.ChangedBy,
                    v.ChangedAtUtc,
                    v.ChangeSummary
                })
                .ToArray(),
            Documents = deal.Documents
                .OrderByDescending(d => d.UploadedAtUtc)
                .Select(d => new
                {
                    d.Id,
                    d.OriginalFileName,
                    d.ContentType,
                    d.FileSizeBytes,
                    d.StoragePath,
                    d.UploadedBy,
                    d.UploadedAtUtc
                })
                .ToArray()
        };
    }

    // Applies any optional bid / cost / payment / stage corrections supplied by
    // the reviewer at route time. Mirrors EnrichDeal but operates inline so the
    // reviewer (who only holds route.configure) doesn't need the sales-side
    // deal.enrich permission.
    private void ApplyReviewerEnrichment(OrderGovernanceDeal deal, ReviewerRouteRequest request)
    {
        var changed = false;

        if (request.ProductValue.HasValue && deal.ProductValue != request.ProductValue.Value) { deal.ProductValue = request.ProductValue.Value; changed = true; }
        if (request.ServiceValue.HasValue && deal.ServiceValue != request.ServiceValue.Value) { deal.ServiceValue = request.ServiceValue.Value; changed = true; }
        if (request.AmcValue.HasValue && deal.AmcValue != request.AmcValue.Value) { deal.AmcValue = request.AmcValue.Value; changed = true; }
        if (request.OthersValue.HasValue && deal.OthersValue != request.OthersValue.Value) { deal.OthersValue = request.OthersValue.Value; changed = true; }
        if (request.ProductCost.HasValue && deal.ProductCost != request.ProductCost.Value) { deal.ProductCost = request.ProductCost.Value; changed = true; }
        if (request.ExternalServiceCost.HasValue && deal.ExternalServiceCost != request.ExternalServiceCost.Value) { deal.ExternalServiceCost = request.ExternalServiceCost.Value; changed = true; }
        if (request.InternalCost.HasValue && deal.InternalCost != request.InternalCost.Value) { deal.InternalCost = request.InternalCost.Value; changed = true; }
        if (request.OthersCost.HasValue && deal.OthersCost != request.OthersCost.Value) { deal.OthersCost = request.OthersCost.Value; changed = true; }

        if (request.CustomerPaymentTerm is not null)
        {
            var trimmed = request.CustomerPaymentTerm.Trim();
            if (!string.Equals(deal.CustomerPaymentTerm ?? string.Empty, trimmed, StringComparison.Ordinal))
            {
                deal.CustomerPaymentTerm = trimmed;
                changed = true;
            }
        }
        if (request.VendorPaymentTerm is not null)
        {
            var trimmed = request.VendorPaymentTerm.Trim();
            if (!string.Equals(deal.VendorPaymentTerm ?? string.Empty, trimmed, StringComparison.Ordinal))
            {
                deal.VendorPaymentTerm = trimmed;
                changed = true;
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Stage))
        {
            var newStage = request.Stage.Trim();
            if (!string.Equals(deal.Stage, newStage, StringComparison.OrdinalIgnoreCase))
            {
                var oldStage = string.IsNullOrWhiteSpace(deal.Stage) ? "—" : deal.Stage;
                deal.Stage = newStage;
                LogHistory(deal, "stage-update", GetActorRole(), $"Stage: {oldStage} -> {newStage}");
                changed = true;
            }
        }

        if (changed)
        {
            LogHistory(deal, "reviewer-enriched", GetActorRole(), "Reviewer corrected bid/cost/payment fields before routing");
        }
    }

    private void LogHistory(OrderGovernanceDeal deal, string eventType, string actorRole, string notes)
    {
        // Add through the DbSet so EF Core unambiguously tracks this as a new
        // (Added) row. Adding via `deal.History.Add(...)` against a tracked
        // parent whose History collection wasn't Include()'d causes EF to infer
        // the entity as Modified (because the client-generated Guid Id is
        // non-default), which then issues an UPDATE that affects 0 rows and
        // throws DbUpdateConcurrencyException.
        var entry = new OrderGovernanceHistory
        {
            DealId = deal.Id,
            EventType = eventType,
            ActorRole = actorRole,
            Notes = notes,
            CreatedAtUtc = DateTime.UtcNow
        };
        dbContext.OrderGovernanceHistory.Add(entry);
        deal.History.Add(entry);
    }

    private string GetActorRole()
    {
        return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value ?? "system";
    }

    private string GetActorEmail()
    {
        return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email")?.Value
            ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
            ?? "unknown";
    }

    private bool UserHasPermission(string permission) =>
        User.Claims.Any(c =>
            c.Type == "permission" &&
            string.Equals(c.Value, permission, StringComparison.OrdinalIgnoreCase));

    private void BumpVersion(OrderGovernanceDeal deal, string reason)
    {
        deal.Version += 1;
        var actor = GetActorRole();
        LogVersionHistory(deal, actor, reason);
        LogHistory(deal, "version-bump", actor, $"Version v{deal.Version}: {reason}");
    }

    private void LogVersionHistory(OrderGovernanceDeal deal, string changedBy, string summary)
    {
        var entry = new OrderGovernanceVersionHistory
        {
            DealId = deal.Id,
            VersionNumber = deal.Version,
            ChangedBy = string.IsNullOrWhiteSpace(changedBy) ? "system" : changedBy.Trim(),
            ChangeSummary = string.IsNullOrWhiteSpace(summary) ? "Version change" : summary.Trim(),
            ChangedAtUtc = DateTime.UtcNow
        };
        dbContext.OrderGovernanceVersionHistory.Add(entry);
        deal.VersionHistory.Add(entry);
    }

    private static decimal ConvertToInr(decimal amount, string currency)
    {
        if (CurrencyRates.TryGetValue(currency ?? "INR", out var rate))
        {
            return amount * rate;
        }
        return amount;
    }

    private static void TrackChange(string oldValue, string newValue, string label, ICollection<string> majorChanges, ICollection<string> metadataChanges)
    {
        var oldNorm = (oldValue ?? string.Empty).Trim();
        var newNorm = (newValue ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(newNorm) || string.Equals(oldNorm, newNorm, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (label is "Account" or "Opportunity" or "Currency" or "Stage" or "Owner")
        {
            majorChanges.Add($"{label}: {oldNorm} -> {newNorm}");
        }
        else
        {
            metadataChanges.Add($"{label}: {oldNorm} -> {newNorm}");
        }
    }

    private static void TrackNumericChange(decimal oldValue, decimal newValue, string label, ICollection<string> majorChanges)
    {
        if (oldValue != newValue)
        {
            majorChanges.Add($"{label}: {oldValue} -> {newValue}");
        }
    }

    private static string SanitizeFileName(string fileName)
    {
        var cleaned = Regex.Replace(fileName ?? "document", @"[^\w\-. ]+", "_");
        return string.IsNullOrWhiteSpace(cleaned) ? "document" : cleaned.Trim();
    }
}
