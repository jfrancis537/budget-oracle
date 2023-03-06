using BudgetOracle.Models;
using BudgetOracle.Models.Configuration;
using BudgetOracle.Models.Teller;
using BudgetOracle.Providers;
using BudgetOracle.Storage;
using DnsClient.Internal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

#if !DEBUG
namespace BudgetOracle.Controllers
{
  [Route("api/teller")]
  [ApiController]
  public class TellerController : ControllerBase
  {
    private readonly TellerConfiguration configuration;
    private readonly TellerProvider provider;
    private readonly IUserDatabase database;
    private readonly ILogger<TellerController> logger;
    public TellerController(
      TellerProvider provider,
      IOptions<TellerConfiguration> configuration,
      IUserDatabase datebase,
      ILogger<TellerController> logger
      )
    {
      this.configuration = configuration.Value ?? throw new ArgumentNullException(nameof(configuration));
      this.provider = provider;
      this.database = datebase;
      this.logger = logger;
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
      catch (Exception ex)
      {
        logger.LogError(ex, "Exception occurred when getting userId for: {user}", username);
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
      catch (Exception ex)
      {
        logger.LogError(ex, "Failed to set userId", id);
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
      catch (Exception ex)
      {
        logger.LogError(ex, "Exception occurred when getting accounts");
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
      catch (Exception ex)
      {
        logger.LogError(ex, "Failed to add accounts");
        return StatusCode(500);
      }
    }

    [HttpDelete]
    [Route("delete/account/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount(string id)
    {
      try
      {
        var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
        var username = usernameClaim.Value;
        var user = await database.GetUser(username);
        var deleted = await database.DeleteLinkedAccount(user.TellerUserId, id);
        return Accepted();
      }
      catch (Exception ex)
      {
        logger.LogError(ex, "Failed to get delete account with id: {accountId}", id);
        return StatusCode(500);
      }
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
      catch (Exception ex)
      {
        logger.LogError(ex, "Failed to get account balance for {accountId}", accountId);
        return StatusCode(500);
      }
    }

    [HttpGet]
    [Route("get/transactions/{accountId}")]
    [Authorize]
    public async Task<IActionResult> GetAccountTransactions(string accountId)
    {
      try
      {
        var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
        var username = usernameClaim.Value;
        var user = await database.GetUser(username);
        var account = await database.GetLinkedAccount(user.TellerUserId, accountId);
        var transactions = await provider.GetTransactionsAsync(account);
        return Ok(transactions);
      }
      catch (Exception ex)
      {
        logger.LogError(ex, "Failed to get transactions balance for {accountId}", accountId);
        return StatusCode(500);
      }
    }
  }
}
#endif