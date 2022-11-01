using BudgetOracle.Models.Teller;
using BudgetOracle.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

#if DEBUG
namespace BudgetOracle.Controllers
{
  [Route("api/teller")]
  [ApiController]
  public class TellerDebugController : ControllerBase
  {
    private readonly JObject SAMPLE_BALANCES;
    private readonly JObject SAMPLE_TRANSACTIONS;
    private readonly string SAMPLE_ACCOUNTS;
    public TellerDebugController()
    {
      SAMPLE_BALANCES = JObject.Parse(@"{
 ""acc_o20o96lg5kdkm3htp8000"": {
  ""id"": ""acc_o20o96lg5kdkm3htp8000"",
  ""current"": 809.42,
  ""available"": 19650.97
 },
 ""acc_o20o96lelkdkm3htp8000"": {
  ""id"": ""acc_o20o96lelkdkm3htp8000"",
  ""current"": 8464.37,
  ""available"": 8464.37
 },
 ""acc_o20o96lflkdkm3htp8000"": {
  ""id"": ""acc_o20o96lflkdkm3htp8000"",
  ""current"": 1904.53,
  ""available"": 10200
 }
}");

      SAMPLE_ACCOUNTS = (
      @"[
 {
  ""name"": ""CREDIT CARD"",
  ""enrollmentId"": ""enr_o29rd1ojled7kpv0lk000"",
  ""userId"": ""usr_o29qe57403o322mrdk000"",
  ""type"": ""credit"",
  ""balanceUrl"": ""https://api.teller.io/accounts/acc_o20o96lg5kdkm3htp8000/balances"",
  ""id"": ""acc_o20o96lg5kdkm3htp8000"",
  ""lastFour"": ""0422"",
  ""accessToken"": ""token_clpl7txr4myztx7biogxy5gzqy""
 },
 {
  ""name"": ""TOTAL CHECKING"",
  ""enrollmentId"": ""enr_o29rd1ojled7kpv0lk000"",
  ""userId"": ""usr_o29qe57403o322mrdk000"",
  ""type"": ""depository"",
  ""balanceUrl"": ""https://api.teller.io/accounts/acc_o20o96lelkdkm3htp8000/balances"",
  ""id"": ""acc_o20o96lelkdkm3htp8000"",
  ""lastFour"": ""7968"",
  ""accessToken"": ""token_clpl7txr4myztx7biogxy5gzqy""
 },
 {
  ""name"": ""CREDIT CARD"",
  ""enrollmentId"": ""enr_o29rd1ojled7kpv0lk000"",
  ""userId"": ""usr_o29qe57403o322mrdk000"",
  ""type"": ""credit"",
  ""balanceUrl"": ""https://api.teller.io/accounts/acc_o20o96lflkdkm3htp8000/balances"",
  ""id"": ""acc_o20o96lflkdkm3htp8000"",
  ""lastFour"": ""2886"",
  ""accessToken"": ""token_clpl7txr4myztx7biogxy5gzqy""
 }
]");
      SAMPLE_TRANSACTIONS = JObject.Parse(System.IO.File.ReadAllText("D:/teller/transactions.json"));
    }



    [HttpGet]
    [Route("get/appid")]
    [Authorize]
    public string GetApplicationId()
    {
      return "app_id";
    }

    [HttpGet]
    [Route("get/userid")]
    [Authorize]
    public IActionResult GetUserId()
    {
      return Ok("user_id");
    }

    [HttpPut]
    [Route("set/userid/{id}")]
    [Authorize]
    public IActionResult SetUserId(string id)
    {
      return Ok(id);
    }

    [HttpGet]
    [Route("get/accounts/all")]
    [Authorize]
    public IActionResult GetAllAccounts()
    {
      return Ok(SAMPLE_ACCOUNTS);
    }

    [HttpPut]
    [Route("add/accounts")]
    [Authorize]
    public IActionResult AddAccounts([FromBody] IEnumerable<LinkedAccountDetails> accounts)
    {
      return StatusCode(201);
    }

    [HttpDelete]
    [Route("delete/account/{id}")]
    [Authorize]
    public IActionResult DeleteAccount(string id)
    {
      return Accepted();
    }

    [HttpPost]
    [Route("get/accounts")]
    [Authorize]
    public IActionResult GetAccountsForEnrollment([FromBody] Enrollment enrollment)
    {
      return Ok(SAMPLE_ACCOUNTS);
    }

    [HttpGet]
    [Route("get/balance/{accountId}")]
    [Authorize]
    public IActionResult GetAccountBalance(string accountId)
    {
      if(SAMPLE_BALANCES[accountId] != null)
      {
        return Ok(SAMPLE_BALANCES[accountId].ToString());
      } else
      {
        return NotFound();
      }
    }

    [HttpGet]
    [Route("get/transactions/{accountId}")]
    [Authorize]
    public IActionResult GetAccountTransactions(string accountId)
    {
      if (SAMPLE_TRANSACTIONS[accountId] != null)
      {
        return Ok(SAMPLE_TRANSACTIONS[accountId].ToString());
      }
      else
      {
        return NotFound();
      }
    }
  }
}
#endif