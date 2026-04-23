namespace backend.Entities;

public class OrderGovernanceApproval
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public string RoleKey { get; set; } = string.Empty;
    public Guid? RoleId { get; set; }
    public Guid? AssignedUserId { get; set; }
    public Guid? VerticalId { get; set; }
    public bool IsRequired { get; set; } = true;
    public string Status { get; set; } = "Pending";
    public string Comments { get; set; } = string.Empty;
    public DateTime? CreatedDateUtc { get; set; }
    public DateTime? ActionDateUtc { get; set; }

    public OrderGovernanceDeal Deal { get; set; } = null!;
    public Role? Role { get; set; }
    public AppUser? AssignedUser { get; set; }
    public VerticalMaster? Vertical { get; set; }
}
