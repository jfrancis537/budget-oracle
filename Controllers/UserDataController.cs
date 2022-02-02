using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Linq;
using BudgetOracle.Storage;
using Newtonsoft.Json.Linq;

namespace BudgetOracle_.Controllers
{
  [Route("api/data")]
  [ApiController]
  public class UserDataController : ControllerBase
  {
    private readonly IUserDatabase userDatabase;
    public UserDataController(IUserDatabase userDatabase)
    {
      this.userDatabase = userDatabase;
    }

    [HttpGet]
    [Route("getState")]
    [Authorize]
    public async Task<IActionResult> GetState()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      var user = await userDatabase.GetUser(username);
      if (user != null)
      {
        return Ok(user.StateData);
      }
      else
      {
        return BadRequest();
      }
    }

    [HttpGet]
    [Route("getGroups")]
    [Authorize]
    public async Task<IActionResult> GetGroups()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      var user = await userDatabase.GetUser(username);
      if (user != null)
      {
        return Ok(user.GroupData);
      }
      else
      {
        return BadRequest();
      }
    }

    [HttpPut]
    [Route("updateState")]
    [Authorize]
    public async Task<IActionResult> UpdateState(JObject data)
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      try
      {
        var state = data["state"].ToString();
        await userDatabase.UpdateState(username, state);
        return Ok();
      }
      catch
      {
        return BadRequest();
      }
    }

    [HttpPut]
    [Route("updateGroups")]
    [Authorize]
    public async Task<IActionResult> UpdateGroups(JObject data)
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      try
      {
        var groups = data["groups"].ToString();
        await userDatabase.UpdateGroups(username, groups);
        return Ok();
      }
      catch
      {
        return BadRequest();
      }
    }
  }
}
