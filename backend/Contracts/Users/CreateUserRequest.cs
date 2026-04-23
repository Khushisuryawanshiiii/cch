namespace backend.Contracts.Users;

public record CreateUserRequest(string Email, string DisplayName, string Password);
