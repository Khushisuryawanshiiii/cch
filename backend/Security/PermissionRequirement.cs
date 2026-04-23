using Microsoft.AspNetCore.Authorization;

namespace backend.Security;

public class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}
