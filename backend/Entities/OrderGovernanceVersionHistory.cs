namespace backend.Entities;

public class OrderGovernanceVersionHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public int VersionNumber { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public Guid? ChangedByUserId { get; set; }
    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;
    public string ChangeSummary { get; set; } = string.Empty;
    public string? SnapshotJson { get; set; }
    public string? TriggerEvent { get; set; }
    public Guid? VerticalId { get; set; }

    public OrderGovernanceDeal Deal { get; set; } = null!;
    public AppUser? ChangedByUser { get; set; }
    public VerticalMaster? Vertical { get; set; }
}
