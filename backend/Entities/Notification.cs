namespace backend.Entities;

public class Notification
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? ModuleId { get; set; }
    public string ReferenceId { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ActionUrl { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public AppUser User { get; set; } = null!;
    public ModuleMaster? Module { get; set; }
}
