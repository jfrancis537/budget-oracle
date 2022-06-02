using BudgetOracle.Constants;
using BudgetOracle.Exceptions;
using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace BudgetOracle.Providers
{
  public class TellerProvider
  {
    private readonly IHttpClientFactory httpClientFactory;
    public TellerProvider(IHttpClientFactory httpClientFactory)
    {
      this.httpClientFactory = httpClientFactory;
    }
    public async Task<List<LinkedAccountDetails>> GetAccountDetailsForEnrollment(Enrollment enrollment)
    {
      var client = httpClientFactory.CreateClient(TellerConstants.TellerHttpClientName);
      var base64Token = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes($"{enrollment.AccessToken}:"));
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Token);
      var response = await client.GetAsync("https://api.teller.io/accounts");
      var results = new List<LinkedAccountDetails>();
      if (response.IsSuccessStatusCode)
      {
        JArray data = JArray.Parse(await response.Content.ReadAsStringAsync());
        foreach (var accountJson in data)
        {
          results.Add(new LinkedAccountDetails()
          {
            Id = accountJson["id"].Value<string>(),
            BalanceUrl = accountJson["links"]["balances"].Value<string>(),
            Name = accountJson["name"].Value<string>(),
            LastFour = accountJson["last_four"].Value<string>(),
            EnrollmentId = accountJson["enrollment_id"].Value<string>(),
            Type = accountJson["type"].Value<string>(),
            UserId = enrollment.User.Id,
            AccessToken = enrollment.AccessToken
          });
        }
        return results;
      }
      else
      {
        throw new TellerException("Failed to fetch accounts", (int)response.StatusCode);
      }
    }

    public async Task<BalanceData> GetBalanceAsync(LinkedAccountDetails account)
    {
      var client = httpClientFactory.CreateClient(TellerConstants.TellerHttpClientName);
      var base64Token = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes($"{account.AccessToken}:"));
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Token);
      var response = await client.GetAsync(account.BalanceUrl);
      if (response.IsSuccessStatusCode)
      {
        JObject json = JObject.Parse(await response.Content.ReadAsStringAsync());
        return new BalanceData()
        {
          Available = double.Parse(json["available"].ToString()),
          Current = double.Parse(json["ledger"].ToString()),
          Id = json["account_id"].ToString()
        };
      }
      else
      {
        throw new TellerException("Failed to get balance", (int)response.StatusCode);
      }
    }
  }
}
