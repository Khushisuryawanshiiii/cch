using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetRoles()
    {
        var roles = await dbContext.Roles
            .OrderBy(r => r.Name)
            .Select(r => new { r.Id, r.Name, r.Description })
            .ToArrayAsync();

        return Ok(roles);
    }
}
