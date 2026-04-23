namespace backend.Entities;

public class OrderGovernanceExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public string SapOrderNumber { get; set; } = string.Empty;
    public string CustomerPoNumber { get; set; } = string.Empty;
    public decimal FinalPoValue { get; set; }
    public Guid? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public OrderGovernanceDeal Deal { get; set; } = null!;
    public AppUser? ConfirmedByUser { get; set; }
}
