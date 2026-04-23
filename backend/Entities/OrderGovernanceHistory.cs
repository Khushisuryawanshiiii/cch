namespace backend.Entities;

public class OrderGovernanceHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public Guid? ApprovalId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public Guid? ActorUserId { get; set; }
    public Guid? ActorRoleId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public OrderGovernanceDeal Deal { get; set; } = null!;
    public OrderGovernanceApproval? Approval { get; set; }
    public AppUser? ActorUser { get; set; }
    public Role? ActorRoleRef { get; set; }
}
