using backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/sales-process")]
[Authorize]
public class SalesProcessController : ControllerBase
{
    [HttpGet("ping")]
    [HasPermission("sales-process.deal.review_l1")]
    public ActionResult Ping()
    {
        return Ok(new { module = "sales-process", status = "ready" });
    }
}
