namespace backend.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public Guid? ModuleId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string OldValuesJson { get; set; } = string.Empty;
    public string NewValuesJson { get; set; } = string.Empty;
    public Guid? PerformedByUserId { get; set; }
    public DateTime PerformedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? CorrelationId { get; set; }

    public ModuleMaster? Module { get; set; }
    public AppUser? PerformedByUser { get; set; }
}
