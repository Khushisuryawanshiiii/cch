namespace backend.Security;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "commercial-control-hub";
    public string Audience { get; set; } = "commercial-control-hub-client";
    public string SecretKey { get; set; } = "replace-this-with-a-secure-key-32-chars-minimum";
    public int ExpiryMinutes { get; set; } = 120;
}
