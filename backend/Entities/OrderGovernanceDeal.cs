namespace backend.Entities;

public class OrderGovernanceDeal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OpportunityNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string OpportunityName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Stage { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending Input";
    public string OpportunityOwner { get; set; } = string.Empty;
    public string AmName { get; set; } = string.Empty;
    public string Manager { get; set; } = string.Empty;
    public string Geo { get; set; } = string.Empty;
    public string DeliveryType { get; set; } = string.Empty;
    public string CloseDate { get; set; } = string.Empty;
    public int Version { get; set; } = 1;

    public decimal ProductValue { get; set; }
    public decimal ServiceValue { get; set; }
    public decimal AmcValue { get; set; }
    public decimal OthersValue { get; set; }
    public decimal ProductCost { get; set; }
    public decimal ExternalServiceCost { get; set; }
    public decimal InternalCost { get; set; }
    public decimal OthersCost { get; set; }
    public string CustomerPaymentTerm { get; set; } = string.Empty;
    public string VendorPaymentTerm { get; set; } = string.Empty;
    public decimal ActualPoValue { get; set; }
    public string SapOrder { get; set; } = string.Empty;
    public string CustomerOrderNo { get; set; } = string.Empty;
    public string RequiredApprovalsCsv { get; set; } = string.Empty;

    public Guid? VerticalId { get; set; }
    public Guid? HorizontalId { get; set; }
    public decimal? ConversionRate { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public VerticalMaster? Vertical { get; set; }
    public HorizontalMaster? Horizontal { get; set; }
    public AppUser? CreatedByUser { get; set; }
    public OrderGovernanceExecution? Execution { get; set; }

    public ICollection<OrderGovernanceApproval> Approvals { get; set; } = [];
    public ICollection<OrderGovernanceHistory> History { get; set; } = [];
    public ICollection<OrderGovernanceVersionHistory> VersionHistory { get; set; } = [];
    public ICollection<OrderGovernanceDocument> Documents { get; set; } = [];
    public ICollection<OrderGovernanceCostBreakup> CostBreakup { get; set; } = [];
}
