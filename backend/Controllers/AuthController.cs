using backend.Contracts.Auth;
using backend.Data;
using backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext dbContext, ITokenService tokenService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);

        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid credentials.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToArray();

        var permissions = await dbContext.RolePermissions
            .Where(rp => user.UserRoles.Select(ur => ur.RoleId).Contains(rp.RoleId))
            .Include(rp => rp.Permission)
            .Select(rp => $"{rp.Permission.Module}.{rp.Permission.Action}")
            .Distinct()
            .ToArrayAsync();

        var token = tokenService.CreateToken(user, roles, permissions);

        return Ok(new LoginResponse(
            token,
            user.Id.ToString(),
            user.Email,
            user.DisplayName,
            roles,
            permissions));
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult Me()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                     ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var email = User.Claims.FirstOrDefault(c => c.Type == "email")?.Value
                    ?? User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var displayName = User.Claims.FirstOrDefault(c => c.Type == "display_name")?.Value;
        var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value).Distinct().ToArray();
        var permissions = User.Claims.Where(c => c.Type == "permission").Select(c => c.Value).Distinct().ToArray();

        return Ok(new { userId, email, displayName, roles, permissions });
    }
}
