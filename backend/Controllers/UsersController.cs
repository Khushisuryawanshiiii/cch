using backend.Contracts.Users;
using backend.Data;
using backend.Entities;
using backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext dbContext) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("bootstrap-admin")]
    public async Task<ActionResult> BootstrapAdmin([FromBody] CreateUserRequest request)
    {
        var hasUsers = await dbContext.Users.AnyAsync();
        if (hasUsers)
        {
            return BadRequest("Bootstrap is allowed only when no users exist.");
        }

        var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "sales-process.sales-manager");
        if (adminRole is null)
        {
            return BadRequest("Default role seed missing.");
        }

        var user = new AppUser
        {
            Email = request.Email.Trim().ToLowerInvariant(),
            DisplayName = request.DisplayName.Trim(),
            PasswordHash = PasswordHasher.Hash(request.Password)
        };

        dbContext.Users.Add(user);
        dbContext.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = adminRole.Id });
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new { }, new { user.Id, user.Email, user.DisplayName });
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult> GetUsers()
    {
        var users = await dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.IsActive,
                Roles = u.UserRoles.Select(ur => ur.Role.Name).ToArray()
            })
            .ToArrayAsync();

        return Ok(users);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await dbContext.Users.AnyAsync(u => u.Email == email);
        if (exists)
        {
            return Conflict("User already exists.");
        }

        var user = new AppUser
        {
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            PasswordHash = PasswordHasher.Hash(request.Password)
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return Ok(new { user.Id, user.Email, user.DisplayName });
    }

    [Authorize]
    [HttpPost("{userId:guid}/roles")]
    public async Task<ActionResult> AssignRole(Guid userId, [FromBody] AssignRoleRequest request)
    {
        var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName.Trim());
        if (role is null)
        {
            return NotFound("Role not found.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            return NotFound("User not found.");
        }

        var assignmentExists = await dbContext.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);
        if (!assignmentExists)
        {
            dbContext.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
            await dbContext.SaveChangesAsync();
        }

        return Ok(new { userId, role = role.Name });
    }
}
