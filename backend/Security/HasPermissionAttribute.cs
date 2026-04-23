using Microsoft.AspNetCore.Authorization;

namespace backend.Security;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "perm:";

    public HasPermissionAttribute(string permission)
    {
        if (!string.IsNullOrWhiteSpace(permission))
        {
            Policy = $"{PolicyPrefix}{permission}";
        }
    }
}
