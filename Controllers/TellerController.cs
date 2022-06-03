using BudgetOracle.Models;
using BudgetOracle.Models.Configuration;
using BudgetOracle.Models.Teller;
using BudgetOracle.Providers;
using BudgetOracle.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace BudgetOracle.Controllers
{
  [Route("api/teller")]
  [ApiController]
  public class TellerController : ControllerBase
  {
    private readonly TellerConfiguration configuration;
    private readonly TellerProvider provider;
    private readonly IUserDatabase database;
    public TellerController(
      TellerProvider provider,
      IOptions<TellerConfiguration> configuration,
      IUserDatabase datebase
      )
    {
      this.configuration = configuration.Value ?? throw new ArgumentNullException(nameof(configuration));
      this.provider = provider;
      this.database = datebase;
    }

    [HttpGet]
    [Route("get/appid")]
    [Authorize]
    public string GetApplicationId()
    {
      return configuration.ApplicationId;
    }

    [HttpGet]
    [Route("get/userid")]
    [Authorize]
    public async Task<IActionResult> GetUserId()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      try
      {
        var user = await database.GetUser(username);
        if (user == null)
        {
          return NotFound();
        }
        else
        {
          return Ok(user.TellerUserId);
        }
      }
      catch
      {
        return StatusCode(500);
      }
    }

    [HttpPut]
    [Route("set/userid/{id}")]
    [Authorize]
    public async Task<IActionResult> SetUserId(string id)
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      try
      {
        await database.SetTellerUserId(username, id);
        return StatusCode(201);
      }
      catch (Exception)
      {
        return StatusCode(500);
      }
    }

    [HttpGet]
    [Route("get/accounts/all")]
    [Authorize]
    public async Task<IActionResult> GetAllAccounts()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      try
      {
        var results = await database.GetAllLinkedAccountDetails(username);
        return Ok(results ?? Enumerable.Empty<LinkedAccountDetails>());
      }
      catch (Exception)
      {
        return StatusCode(500);
      }
    }

    [HttpPut]
    [Route("add/accounts")]
    [Authorize]
    public async Task<IActionResult> AddAccounts([FromBody] IEnumerable<LinkedAccountDetails> accounts)
    {
      try
      {
        var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
        var username = usernameClaim.Value;
        foreach (var account in accounts)
        {
          await database.AddLinkedAccount(username, account);
        }
        return StatusCode(201);
      }
      catch (Exception)
      {
        return StatusCode(500);
      }
    }

    [HttpDelete]
    [Route("delete/account/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
      await Task.CompletedTask;
      return BadRequest();
    }

    [HttpPost]
    [Route("get/accounts")]
    [Authorize]
    public async Task<List<LinkedAccountDetails>> GetAccountsForEnrollment([FromBody] Enrollment enrollment)
    {
      return await provider.GetAccountDetailsForEnrollment(enrollment);
    }

    [HttpGet]
    [Route("get/balance/{accountId}")]
    [Authorize]
    public async Task<IActionResult> GetAccountBalance(string accountId)
    {
      try
      {
        var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
        var username = usernameClaim.Value;
        var user = await database.GetUser(username);
        var account = await database.GetLinkedAccount(user.TellerUserId, accountId);
        var balance = await provider.GetBalanceAsync(account);
        return Ok(balance);
      }
      catch
      {
        return StatusCode(500);
      }
    }

  }
}
