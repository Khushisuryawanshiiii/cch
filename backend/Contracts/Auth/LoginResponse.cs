namespace backend.Contracts.Auth;

public record LoginResponse(
    string AccessToken,
    string UserId,
    string Email,
    string DisplayName,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions);
