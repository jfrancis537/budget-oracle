﻿using BudgetOracle.Constants;
using BudgetOracle.Exceptions;
using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using DnsClient.Internal;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<TellerProvider> logger;
    public TellerProvider(IHttpClientFactory httpClientFactory, ILogger<TellerProvider> logger)
    {
      this.httpClientFactory = httpClientFactory;
      this.logger = logger;
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
        var data = new BalanceData()
        {
          Id = json["account_id"].ToString()
        };
        if (double.TryParse(json["available"].ToString(), out double available))
        {
          data.Available = available;
        }
        else
        {
          data.Available = double.NaN;
        }

        if (double.TryParse(json["ledger"].ToString(), out double current))
        {
          data.Current = current;
        }
        else
        {
          data.Current = double.NaN;
        }
        return data;
      }
      else
      {
        throw new TellerException("Failed to get balance", (int)response.StatusCode);
      }
    }

    public async Task<IEnumerable<TransactionData>> GetTransactionsAsync(LinkedAccountDetails account)
    {
      var client = httpClientFactory.CreateClient(TellerConstants.TellerHttpClientName);
      var base64Token = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes($"{account.AccessToken}:"));
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Token);
      var response = await client.GetAsync($"https://api.teller.io/accounts/{account.Id}/transactions");
      if (response.IsSuccessStatusCode)
      {
        JArray json = JArray.Parse(await response.Content.ReadAsStringAsync());
        var result = new List<TransactionData>();
        foreach (var transactionJson in json)
        {
          result.Add(new TransactionData()
          {
            AccountId = transactionJson["account_id"].ToString(),
            Id = transactionJson["id"].ToString(),
            Status = transactionJson["status"].ToString(),
            Amount = double.Parse(transactionJson["amount"].ToString()),
            Type = transactionJson["type"].ToString(),
            Date = transactionJson["date"].ToString(),
            Description = transactionJson["description"].ToString(),
            Category = transactionJson["details"]["category"].ToString()
          });
        };
        return result;
      }
      else
      {
        throw new TellerException("Failed to get balance", (int)response.StatusCode);
      }
    }
  }
}
