using backend.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    private static readonly Guid SalesProcessModuleId = Guid.Parse("a0000000-0000-0000-0000-000000000001");
    private static readonly Guid OrderGovernanceModuleId = Guid.Parse("a0000000-0000-0000-0000-000000000002");
    private static readonly Guid SalesProcessSalesManagerRoleId = Guid.Parse("10111111-1111-1111-1111-111111111111");
    private static readonly Guid SalesProcessRegionalManagerRoleId = Guid.Parse("10222222-2222-2222-2222-222222222222");
    private static readonly Guid SalesProcessCentralManagerRoleId = Guid.Parse("10333333-3333-3333-3333-333333333333");
    private static readonly Guid OrderGovernanceSalesRoleId = Guid.Parse("20111111-1111-1111-1111-111111111111");
    private static readonly Guid OrderGovernanceReviewerRoleId = Guid.Parse("20222222-2222-2222-2222-222222222222");
    private static readonly Guid OrderGovernanceApproverRoleId = Guid.Parse("20333333-3333-3333-3333-333333333333");
    private static readonly Guid OrderGovernanceCcManagerRoleId = Guid.Parse("20444444-4444-4444-4444-444444444444");
    private static readonly Guid OgApproverFinanceRoleId = Guid.Parse("20555555-5555-5555-5555-555555555501");
    private static readonly Guid OgApproverLegalRoleId = Guid.Parse("20555555-5555-5555-5555-555555555502");
    private static readonly Guid OgApproverBusinessHeadRoleId = Guid.Parse("20555555-5555-5555-5555-555555555503");
    private static readonly Guid OgApproverScmRoleId = Guid.Parse("20555555-5555-5555-5555-555555555504");
    private static readonly Guid OgApproverServiceDeliveryRoleId = Guid.Parse("20555555-5555-5555-5555-555555555505");
    private static readonly Guid OgApproverPreSalesRoleId = Guid.Parse("20555555-5555-5555-5555-555555555506");

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<ModuleMaster> Modules => Set<ModuleMaster>();
    public DbSet<VerticalMaster> Verticals => Set<VerticalMaster>();
    public DbSet<HorizontalMaster> Horizontals => Set<HorizontalMaster>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<OrderGovernanceDeal> OrderGovernanceDeals => Set<OrderGovernanceDeal>();
    public DbSet<OrderGovernanceApproval> OrderGovernanceApprovals => Set<OrderGovernanceApproval>();
    public DbSet<OrderGovernanceHistory> OrderGovernanceHistory => Set<OrderGovernanceHistory>();
    public DbSet<OrderGovernanceVersionHistory> OrderGovernanceVersionHistory => Set<OrderGovernanceVersionHistory>();
    public DbSet<OrderGovernanceDocument> OrderGovernanceDocuments => Set<OrderGovernanceDocument>();
    public DbSet<OrderGovernanceCostBreakup> OrderGovernanceCostBreakup => Set<OrderGovernanceCostBreakup>();
    public DbSet<OrderGovernanceExecution> OrderGovernanceExecution => Set<OrderGovernanceExecution>();
    public DbSet<ApprovalRoleAssignment> ApprovalRoleAssignments => Set<ApprovalRoleAssignment>();
    public DbSet<MarginThresholdConfig> MarginThresholds => Set<MarginThresholdConfig>();
    public DbSet<MarginThresholdRole> MarginThresholdRoles => Set<MarginThresholdRole>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.EmployeeCode).HasMaxLength(50);
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.EmployeeCode);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Code).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => new { e.ModuleId, e.Code });
            entity.HasOne(e => e.Module)
                .WithMany(m => m.Roles)
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("Permissions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Module).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => new { e.Module, e.Action }).IsUnique();
            entity.HasIndex(e => new { e.ModuleId, e.Action });
            entity.HasOne(e => e.ModuleRef)
                .WithMany(m => m.Permissions)
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.HasOne(e => e.User).WithMany(e => e.UserRoles).HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Role).WithMany(e => e.UserRoles).HasForeignKey(e => e.RoleId);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("RolePermissions");
            entity.HasKey(e => new { e.RoleId, e.PermissionId });
            entity.HasOne(e => e.Role).WithMany(e => e.RolePermissions).HasForeignKey(e => e.RoleId);
            entity.HasOne(e => e.Permission).WithMany(e => e.RolePermissions).HasForeignKey(e => e.PermissionId);
        });

        modelBuilder.Entity<ModuleMaster>(entity =>
        {
            entity.ToTable("ModuleMaster");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<VerticalMaster>(entity =>
        {
            entity.ToTable("VerticalMaster");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<HorizontalMaster>(entity =>
        {
            entity.ToTable("HorizontalMaster");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EntityName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.ReferenceId).HasMaxLength(64).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(60).IsRequired();
            entity.HasIndex(e => new { e.ModuleId, e.PerformedAtUtc });
            entity.HasIndex(e => new { e.EntityName, e.ReferenceId });
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PerformedByUser)
                .WithMany()
                .HasForeignKey(e => e.PerformedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ReferenceId).HasMaxLength(64);
            entity.Property(e => e.Category).HasMaxLength(60).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.ActionUrl).HasMaxLength(500);
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAtUtc });
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderGovernanceDeal>(entity =>
        {
            entity.ToTable("OrderGovernanceDeals");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OpportunityNumber).HasMaxLength(100).IsRequired();
            entity.Property(e => e.AccountName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.OpportunityName).HasMaxLength(300).IsRequired();
            entity.Property(e => e.Currency).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Stage).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(60).IsRequired();
            entity.Property(e => e.OpportunityOwner).HasMaxLength(120);
            entity.Property(e => e.AmName).HasMaxLength(120);
            entity.Property(e => e.Manager).HasMaxLength(120);
            entity.Property(e => e.Geo).HasMaxLength(80);
            entity.Property(e => e.DeliveryType).HasMaxLength(80);
            entity.Property(e => e.CloseDate).HasMaxLength(50);
            entity.Property(e => e.CustomerPaymentTerm).HasMaxLength(300);
            entity.Property(e => e.VendorPaymentTerm).HasMaxLength(300);
            entity.Property(e => e.SapOrder).HasMaxLength(100);
            entity.Property(e => e.CustomerOrderNo).HasMaxLength(100);
            entity.Property(e => e.RequiredApprovalsCsv).HasMaxLength(500);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.ProductValue).HasPrecision(18, 2);
            entity.Property(e => e.ServiceValue).HasPrecision(18, 2);
            entity.Property(e => e.AmcValue).HasPrecision(18, 2);
            entity.Property(e => e.OthersValue).HasPrecision(18, 2);
            entity.Property(e => e.ProductCost).HasPrecision(18, 2);
            entity.Property(e => e.ExternalServiceCost).HasPrecision(18, 2);
            entity.Property(e => e.InternalCost).HasPrecision(18, 2);
            entity.Property(e => e.OthersCost).HasPrecision(18, 2);
            entity.Property(e => e.ActualPoValue).HasPrecision(18, 2);
            entity.Property(e => e.ConversionRate).HasPrecision(18, 6);
            entity.HasIndex(e => e.OpportunityNumber);
            entity.HasIndex(e => e.VerticalId);
            entity.HasIndex(e => e.HorizontalId);
            entity.HasOne(e => e.Vertical)
                .WithMany()
                .HasForeignKey(e => e.VerticalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Horizontal)
                .WithMany()
                .HasForeignKey(e => e.HorizontalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderGovernanceApproval>(entity =>
        {
            entity.ToTable("OrderGovernanceApprovals");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RoleKey).HasMaxLength(60).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(40).IsRequired();
            entity.Property(e => e.Comments).HasMaxLength(1000);
            entity.HasOne(e => e.Deal)
                .WithMany(d => d.Approvals)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.AssignedUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Vertical)
                .WithMany()
                .HasForeignKey(e => e.VerticalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.DealId, e.RoleKey }).IsUnique();
            entity.HasIndex(e => new { e.DealId, e.Status });
        });

        modelBuilder.Entity<OrderGovernanceHistory>(entity =>
        {
            entity.ToTable("OrderGovernanceHistory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).HasMaxLength(80).IsRequired();
            entity.Property(e => e.ActorRole).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasOne(e => e.Deal)
                .WithMany(d => d.History)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Approval)
                .WithMany()
                .HasForeignKey(e => e.ApprovalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ActorUser)
                .WithMany()
                .HasForeignKey(e => e.ActorUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ActorRoleRef)
                .WithMany()
                .HasForeignKey(e => e.ActorRoleId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.DealId, e.CreatedAtUtc });
        });

        modelBuilder.Entity<OrderGovernanceVersionHistory>(entity =>
        {
            entity.ToTable("OrderGovernanceVersionHistory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VersionNumber).IsRequired();
            entity.Property(e => e.ChangedBy).HasMaxLength(120).IsRequired();
            entity.Property(e => e.ChangeSummary).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.TriggerEvent).HasMaxLength(60);
            entity.HasOne(e => e.Deal)
                .WithMany(d => d.VersionHistory)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ChangedByUser)
                .WithMany()
                .HasForeignKey(e => e.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Vertical)
                .WithMany()
                .HasForeignKey(e => e.VerticalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.DealId, e.VersionNumber }).IsUnique();
            entity.HasIndex(e => new { e.DealId, e.ChangedAtUtc });
        });

        modelBuilder.Entity<OrderGovernanceCostBreakup>(entity =>
        {
            entity.ToTable("OrderGovernanceCostBreakup");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CostTypeCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CostTypeLabel).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasOne(e => e.Deal)
                .WithMany(d => d.CostBreakup)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.DealId, e.CostTypeCode }).IsUnique();
        });

        modelBuilder.Entity<OrderGovernanceExecution>(entity =>
        {
            entity.ToTable("OrderGovernanceExecution");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SapOrderNumber).HasMaxLength(100);
            entity.Property(e => e.CustomerPoNumber).HasMaxLength(100);
            entity.Property(e => e.FinalPoValue).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasOne(e => e.Deal)
                .WithOne(d => d.Execution)
                .HasForeignKey<OrderGovernanceExecution>(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ConfirmedByUser)
                .WithMany()
                .HasForeignKey(e => e.ConfirmedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.DealId).IsUnique();
        });

        modelBuilder.Entity<ApprovalRoleAssignment>(entity =>
        {
            entity.ToTable("ApprovalRoleAssignments");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Vertical)
                .WithMany()
                .HasForeignKey(e => e.VerticalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.ModuleId, e.RoleId, e.VerticalId, e.UserId }).IsUnique();
            entity.HasIndex(e => new { e.RoleId, e.IsActive });
        });

        modelBuilder.Entity<MarginThresholdConfig>(entity =>
        {
            entity.ToTable("MarginThresholdConfig");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MinMarginPercent).HasPrecision(9, 4);
            entity.Property(e => e.MaxMarginPercent).HasPrecision(9, 4);
            entity.HasOne(e => e.Module)
                .WithMany()
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Vertical)
                .WithMany()
                .HasForeignKey(e => e.VerticalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.ModuleId, e.VerticalId, e.IsActive });
        });

        modelBuilder.Entity<MarginThresholdRole>(entity =>
        {
            entity.ToTable("MarginThresholdRoles");
            entity.HasKey(e => new { e.ThresholdId, e.RoleId });
            entity.HasOne(e => e.Threshold)
                .WithMany(t => t.Roles)
                .HasForeignKey(e => e.ThresholdId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Role)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderGovernanceDocument>(entity =>
        {
            entity.ToTable("OrderGovernanceDocuments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OriginalFileName).HasMaxLength(260).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(150).IsRequired();
            entity.Property(e => e.StoragePath).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.UploadedBy).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FileSizeBytes).IsRequired();
            entity.HasOne(e => e.Deal)
                .WithMany(d => d.Documents)
                .HasForeignKey(e => e.DealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.DealId, e.UploadedAtUtc });
        });

        SeedRbac(modelBuilder);
    }

    private static void SeedRbac(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 04, 23, 0, 0, 0, DateTimeKind.Utc);

        var modules = new[]
        {
            new ModuleMaster { Id = SalesProcessModuleId, Code = "sales-process", Name = "Sales Process", IsActive = true, CreatedAtUtc = seedDate },
            new ModuleMaster { Id = OrderGovernanceModuleId, Code = "order-governance", Name = "Order Governance", IsActive = true, CreatedAtUtc = seedDate }
        };
        modelBuilder.Entity<ModuleMaster>().HasData(modules);

        var roles = new[]
        {
            new Role { Id = SalesProcessSalesManagerRoleId, Name = "sales-process.sales-manager", Code = "sales-manager", ModuleId = SalesProcessModuleId, Description = "Sales Process module Sales Manager", IsActive = true },
            new Role { Id = SalesProcessRegionalManagerRoleId, Name = "sales-process.regional-manager", Code = "regional-manager", ModuleId = SalesProcessModuleId, Description = "Sales Process module Regional Manager (L1)", IsActive = true },
            new Role { Id = SalesProcessCentralManagerRoleId, Name = "sales-process.central-manager", Code = "central-manager", ModuleId = SalesProcessModuleId, Description = "Sales Process module Central Manager (L2)", IsActive = true },
            new Role { Id = OrderGovernanceSalesRoleId, Name = "order-governance.sales", Code = "sales", ModuleId = OrderGovernanceModuleId, Description = "Order Governance module Sales role", IsActive = true },
            new Role { Id = OrderGovernanceReviewerRoleId, Name = "order-governance.reviewer", Code = "reviewer", ModuleId = OrderGovernanceModuleId, Description = "Order Governance module Reviewer role", IsActive = true },
            new Role { Id = OrderGovernanceApproverRoleId, Name = "order-governance.approver", Code = "approver", ModuleId = OrderGovernanceModuleId, Description = "Deprecated: use order-governance.approver-* lane roles", IsActive = false },
            new Role { Id = OrderGovernanceCcManagerRoleId, Name = "order-governance.cc-manager", Code = "cc-manager", ModuleId = OrderGovernanceModuleId, Description = "Order Governance module CC Manager role", IsActive = true },
            new Role { Id = OgApproverFinanceRoleId, Name = "order-governance.approver-finance", Code = "approver-finance", ModuleId = OrderGovernanceModuleId, Description = "Order Governance Finance approver lane", IsActive = true },
            new Role { Id = OgApproverLegalRoleId, Name = "order-governance.approver-legal", Code = "approver-legal", ModuleId = OrderGovernanceModuleId, Description = "Order Governance Legal approver lane", IsActive = true },
            new Role { Id = OgApproverBusinessHeadRoleId, Name = "order-governance.approver-business-head", Code = "approver-business-head", ModuleId = OrderGovernanceModuleId, Description = "Order Governance Business Head approver lane", IsActive = true },
            new Role { Id = OgApproverScmRoleId, Name = "order-governance.approver-scm", Code = "approver-scm", ModuleId = OrderGovernanceModuleId, Description = "Order Governance SCM approver lane", IsActive = true },
            new Role { Id = OgApproverServiceDeliveryRoleId, Name = "order-governance.approver-service-delivery", Code = "approver-service-delivery", ModuleId = OrderGovernanceModuleId, Description = "Order Governance Service Delivery approver lane", IsActive = true },
            new Role { Id = OgApproverPreSalesRoleId, Name = "order-governance.approver-pre-sales", Code = "approver-pre-sales", ModuleId = OrderGovernanceModuleId, Description = "Order Governance Pre-Sales approver lane", IsActive = true }
        };

        var permissions = new[]
        {
            NewPermission("sales-process", "deal.create", "Create sales-process deals"),
            NewPermission("sales-process", "deal.edit_draft", "Edit draft or rejected sales-process deals"),
            NewPermission("sales-process", "deal.submit", "Submit sales-process deals for L1 review"),
            NewPermission("sales-process", "deal.review_l1", "Review deals at L1"),
            NewPermission("sales-process", "deal.edit_amount_l1", "Update deal amount at L1 within guardrails"),
            NewPermission("sales-process", "deal.approve_l1", "Approve deals at L1"),
            NewPermission("sales-process", "deal.reject_l1", "Reject deals at L1"),
            NewPermission("sales-process", "deal.review_l2", "Review deals at L2"),
            NewPermission("sales-process", "deal.approve_l2", "Final approve deals at L2"),
            NewPermission("sales-process", "deal.reject_l2", "Reject deals at L2"),
            NewPermission("order-governance", "deal.ingest_excel", "Ingest Salesforce Excel dump"),
            NewPermission("order-governance", "deal.enrich", "Enrich order-governance deal details"),
            NewPermission("order-governance", "deal.submit", "Submit order-governance deal for review"),
            NewPermission("order-governance", "deal.triage", "Triage submitted deals"),
            NewPermission("order-governance", "route.configure", "Configure required approver route"),
            NewPermission("order-governance", "deal.return_to_sales", "Return deal to sales for correction"),
            NewPermission("order-governance", "deal.review_required", "Review routed deals as required approver (legacy)"),
            NewPermission("order-governance", "deal.review_finance", "Act as Finance approver on routed deals"),
            NewPermission("order-governance", "deal.review_legal", "Act as Legal approver on routed deals"),
            NewPermission("order-governance", "deal.review_business_head", "Act as Business Head approver on routed deals"),
            NewPermission("order-governance", "deal.review_scm", "Act as SCM approver on routed deals"),
            NewPermission("order-governance", "deal.review_service_delivery", "Act as Service Delivery approver on routed deals"),
            NewPermission("order-governance", "deal.review_pre_sales", "Act as Pre-Sales approver on routed deals"),
            NewPermission("order-governance", "deal.manage_documents", "Upload and delete order-governance deal documents"),
            NewPermission("order-governance", "deal.approve", "Approve order-governance deal"),
            NewPermission("order-governance", "deal.reject", "Reject order-governance deal"),
            NewPermission("order-governance", "final.capture_po", "Capture Actual PO/SAP/Customer order details"),
            NewPermission("order-governance", "final.confirm_order", "Confirm final order execution")
        };

        modelBuilder.Entity<Role>().HasData(roles);
        modelBuilder.Entity<Permission>().HasData(permissions);

        var permissionByKey = permissions.ToDictionary(p => $"{p.Module}:{p.Action}", p => p.Id);
        var rolePermissionSeeds = new List<RolePermission>();

        AddRolePermissions(rolePermissionSeeds, SalesProcessSalesManagerRoleId, permissionByKey, [
            "sales-process:deal.create",
            "sales-process:deal.edit_draft",
            "sales-process:deal.submit"
        ]);

        AddRolePermissions(rolePermissionSeeds, SalesProcessRegionalManagerRoleId, permissionByKey, [
            "sales-process:deal.review_l1",
            "sales-process:deal.edit_amount_l1",
            "sales-process:deal.approve_l1",
            "sales-process:deal.reject_l1"
        ]);

        AddRolePermissions(rolePermissionSeeds, SalesProcessCentralManagerRoleId, permissionByKey, [
            "sales-process:deal.review_l2",
            "sales-process:deal.approve_l2",
            "sales-process:deal.reject_l2"
        ]);

        AddRolePermissions(rolePermissionSeeds, OrderGovernanceSalesRoleId, permissionByKey, [
            "order-governance:deal.manage_documents",
            "order-governance:deal.enrich",
            "order-governance:deal.submit"
        ]);

        // Reviewer now owns the Excel ingestion step (upload + delete of draft
        // imports). Sales only enriches and submits the deals placed in their
        // queue by the reviewer.
        AddRolePermissions(rolePermissionSeeds, OrderGovernanceReviewerRoleId, permissionByKey, [
            "order-governance:deal.ingest_excel",
            "order-governance:deal.manage_documents",
            "order-governance:deal.triage",
            "order-governance:route.configure",
            "order-governance:deal.return_to_sales"
        ]);

        AddRolePermissions(rolePermissionSeeds, OgApproverFinanceRoleId, permissionByKey, [
            "order-governance:deal.review_finance",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);
        AddRolePermissions(rolePermissionSeeds, OgApproverLegalRoleId, permissionByKey, [
            "order-governance:deal.review_legal",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);
        AddRolePermissions(rolePermissionSeeds, OgApproverBusinessHeadRoleId, permissionByKey, [
            "order-governance:deal.review_business_head",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);
        AddRolePermissions(rolePermissionSeeds, OgApproverScmRoleId, permissionByKey, [
            "order-governance:deal.review_scm",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);
        AddRolePermissions(rolePermissionSeeds, OgApproverServiceDeliveryRoleId, permissionByKey, [
            "order-governance:deal.review_service_delivery",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);
        AddRolePermissions(rolePermissionSeeds, OgApproverPreSalesRoleId, permissionByKey, [
            "order-governance:deal.review_pre_sales",
            "order-governance:deal.approve",
            "order-governance:deal.reject"
        ]);

        AddRolePermissions(rolePermissionSeeds, OrderGovernanceCcManagerRoleId, permissionByKey, [
            "order-governance:final.capture_po",
            "order-governance:final.confirm_order"
        ]);

        modelBuilder.Entity<RolePermission>().HasData(rolePermissionSeeds);
    }

    private static Permission NewPermission(string module, string action, string description)
    {
        var key = $"{module}:{action}";
        var moduleId = module switch
        {
            "sales-process" => SalesProcessModuleId,
            "order-governance" => OrderGovernanceModuleId,
            _ => (Guid?)null
        };
        return new Permission
        {
            Id = CreateDeterministicGuid(key),
            Module = module,
            ModuleId = moduleId,
            Action = action,
            Name = action,
            Description = description,
            IsActive = true
        };
    }

    private static Guid CreateDeterministicGuid(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        var hash = MD5.HashData(bytes);
        return new Guid(hash);
    }

    private static void AddRolePermissions(
        ICollection<RolePermission> target,
        Guid roleId,
        IReadOnlyDictionary<string, Guid> permissionByKey,
        IEnumerable<string> keys)
    {
        foreach (var key in keys)
        {
            target.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionByKey[key]
            });
        }
    }
}
