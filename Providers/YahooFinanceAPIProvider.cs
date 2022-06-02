using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson.IO;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace BudgetOracle_.Providers
{
  public class YahooFinanceAPIProvider : IStockDataProvider
  {
    private readonly IHttpClientFactory httpClientFactory;
    public YahooFinanceAPIProvider(IHttpClientFactory httpClientFactory)
    {
      this.httpClientFactory = httpClientFactory;
    }

    public double GetStockPriceNow(string symbol)
    {
      return GetStockPriceNowAsync(symbol).Result;
    }

    public async Task<double> GetStockPriceNowAsync(string symbol)
    {
      var url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol;
      using var client = httpClientFactory.CreateClient();
      var response = await client.GetAsync(url);
      if (response.IsSuccessStatusCode)
      {
        var responseData = await response.Content.ReadAsStringAsync();
        var data = JObject.Parse(responseData);
        try
        {
          var result = data["chart"]["result"];
          if (result == null)
          {
            return -1;
          }
          return result[0]["meta"]["regularMarketPrice"]?.Value<double>() ?? -1;
        }
        catch
        {
          throw new Exception("Failed to get value");
        }
      }
      else
      {
        return -1;
      }
    }
  }
}
