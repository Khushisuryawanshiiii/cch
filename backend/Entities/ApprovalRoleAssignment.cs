namespace backend.Entities;

public class ApprovalRoleAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoleId { get; set; }
    public Guid ModuleId { get; set; }
    public Guid? VerticalId { get; set; }
    public Guid UserId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Role Role { get; set; } = null!;
    public ModuleMaster Module { get; set; } = null!;
    public VerticalMaster? Vertical { get; set; }
    public AppUser User { get; set; } = null!;
}
