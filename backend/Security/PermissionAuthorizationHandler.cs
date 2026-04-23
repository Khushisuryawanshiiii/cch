using Microsoft.AspNetCore.Authorization;

namespace backend.Security;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var hasPermission = context.User.Claims
            .Where(c => c.Type == "permission")
            .Select(c => c.Value)
            .Contains(requirement.Permission, StringComparer.OrdinalIgnoreCase);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
