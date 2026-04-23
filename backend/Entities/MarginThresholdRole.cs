namespace backend.Entities;

public class MarginThresholdRole
{
    public Guid ThresholdId { get; set; }
    public Guid RoleId { get; set; }

    public MarginThresholdConfig Threshold { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
