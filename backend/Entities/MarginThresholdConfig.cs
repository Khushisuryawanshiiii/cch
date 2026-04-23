namespace backend.Entities;

public class MarginThresholdConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModuleId { get; set; }
    public Guid? VerticalId { get; set; }
    public decimal MinMarginPercent { get; set; }
    public decimal MaxMarginPercent { get; set; }
    public int ApprovalLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? EffectiveFromUtc { get; set; }
    public DateTime? EffectiveToUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ModuleMaster Module { get; set; } = null!;
    public VerticalMaster? Vertical { get; set; }
    public ICollection<MarginThresholdRole> Roles { get; set; } = [];
}
