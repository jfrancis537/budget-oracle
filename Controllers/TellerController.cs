using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using BudgetOracle.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace BudgetOracle.Controllers
{
  [Route("api/teller")]
  [ApiController]
  public class TellerController : ControllerBase
  {

    private readonly IUserDatabase userDatabase;
    private readonly IHttpClientFactory httpClientFactory;
    public TellerController(IUserDatabase userDatabase, IHttpClientFactory httpClientFactory)
    {
      this.userDatabase = userDatabase;
      this.httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    [Route("get/userid")]
    [Authorize]
    public async Task<IActionResult> GetTellerUserId()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      var user = await userDatabase.GetUser(username);
      if (user != null)
      {
        if (user.TellerUserId == null)
        {
          return NotFound();
        }
        else
        {
          return Ok(user.TellerUserId);
        }
      }
      else
      {
        return BadRequest();
      }
    }

    [HttpPut]
    [Route("set/userid/{id}")]
    [Authorize]
    public async Task<IActionResult> SetTellerUserId(string id)
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      await userDatabase.SetTellerUserId(username, id);
      return Ok();
    }

    [HttpGet]
    [Route("get/enrollments")]
    [Authorize]
    public async Task<IActionResult> GetAllEnrollments()
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      var enrollments = await userDatabase.GetEnrollmentsForUser(username);
      return Ok(enrollments.Select(enrollment =>
      {
        return new { id = enrollment.EnrollmentId, userId = enrollment.TellerUserId };
      }));
    }

    [HttpPut]
    [Route("add/enrollment")]
    [Authorize]
    public async Task<IActionResult> AddEnrollment(JObject body)
    {
      try
      {
        var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
        var username = usernameClaim.Value;
        var user = await userDatabase.GetUser(username);
        if (user != null)
        {
          var enrollment = new Enrollment()
          {
            OwnerUsername = username,
            AccessToken = body["accessToken"].ToString(),
            EnrollmentId = body["enrollment"]["id"].ToString(),
            InstitutionName = body["enrollment"]["institution"]["name"].ToString(),
            TellerUserId = body["user"]["id"].ToString(),
            //Signatures = body["signatures"].Value<List<string>>()
          };
          await userDatabase.AddEnrollment(enrollment);
          return Accepted();
        }
        else
        {
          return BadRequest();
        }
      }
      catch (Newtonsoft.Json.JsonException)
      {
        return BadRequest();
      }
    }

    [HttpGet]
    [Route("get/accounts/{enrollmentId}")]
    [Authorize]
    public async Task<IActionResult> GetEnrollmentData(string enrollmentId)
    {
      var usernameClaim = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.Name);
      var username = usernameClaim.Value;
      var enrollment = await userDatabase.GetEnrollment(username, enrollmentId);
      if (enrollment != null)
      {
        return Ok(await GetDataForEnrollment(enrollment));
      }
      else
      {
        return NotFound();
      }

    }

    private async Task<List<LinkedAccount>> GetDataForEnrollment(Enrollment enrollment)
    {
      var client = httpClientFactory.CreateClient("Teller");
      var base64Token = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes($"{enrollment.AccessToken}:"));
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Token);
      var response = await client.GetAsync("https://api.teller.io/accounts");
      var accounts = new List<LinkedAccount>();
      if (response.IsSuccessStatusCode)
      {
        JArray data = JArray.Parse(await response.Content.ReadAsStringAsync());
        foreach (var accountJson in data)
        {
          var type = accountJson["type"].ToString();
          var balanceUrl = accountJson["links"]["balances"].ToString();
          var name = $"{accountJson["institution"]["name"]} {accountJson["name"]}";
          var balanceResp = await client.GetAsync(balanceUrl);
          if (balanceResp.IsSuccessStatusCode)
          {
            JObject balanceJson = JObject.Parse(await balanceResp.Content.ReadAsStringAsync());
            var valueStr = type == "credit" ? balanceJson["ledger"].ToString() : balanceJson["available"].ToString();
            var amount = double.Parse(valueStr);
            accounts.Add(new LinkedAccount()
            {
              Amount = amount,
              Name = name,
              Type = type == "credit" ? LinkedAccountType.CREDIT : LinkedAccountType.BANK,
              EnrollmentId = enrollment.EnrollmentId
            });
          }
        }
      }
      else
      {
        throw new Exception("Failed to get account data");
      }
      return accounts;
    }
  }
}
