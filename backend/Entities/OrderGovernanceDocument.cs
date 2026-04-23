namespace backend.Entities;

public class OrderGovernanceDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DealId { get; set; }
    public OrderGovernanceDeal Deal { get; set; } = null!;

    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;

    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}

