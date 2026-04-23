namespace backend.Entities;

public class OrderGovernanceCostBreakup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public string CostTypeCode { get; set; } = string.Empty;
    public string CostTypeLabel { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public OrderGovernanceDeal Deal { get; set; } = null!;
}
