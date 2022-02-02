//using OpenQA.Selenium;
//using OpenQA.Selenium.Chrome;
//using OpenQA.Selenium.Edge;
//using OpenQA.Selenium.Support.UI;
//using System;
//using System.Threading.Tasks;

//namespace BudgetOracle_.Providers
//{
//  public class YahooFinanceWebScrapeProvider : IStockDataProvider
//  {
//    private static readonly string yahooUrl = "https://finance.yahoo.com/quote/";
//    private WebDriver driver;
//    public YahooFinanceWebScrapeProvider()
//    {
//      if (Environment.OSVersion.Platform == PlatformID.Win32NT)
//      {
//        var opts = new EdgeOptions();
//        opts.AddArgument("headless");
//        opts.AddArgument("disable-gpu");
//        driver = new EdgeDriver();
//      }
//      else
//      {
//        var opts = new ChromeOptions();
//        opts.AddArgument("--headless");
//        opts.AddArgument("--disable-gpu");
//        driver = new ChromeDriver();
//      }
//    }
//    public double GetStockPriceNow(string symbol)
//    {

//      var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(5));
//      driver.Navigate().GoToUrl(yahooUrl + symbol);
//      wait.Until(d =>
//      {
//        return driver.Url.Contains("lookup") || driver.Url.Contains("quote");
//      });
//      if (driver.Url.Contains("lookup"))
//      {
//        return -1.0;
//      }
//      else
//      {
//        var elem = driver.FindElement(By.CssSelector("fin-streamer[data-test=qsp-price]"));
//        if (elem != null)
//        {
//          bool worked = double.TryParse(elem.Text, out var result);
//          if (worked)
//          {
//            return result;
//          }
//          else
//          {
//            throw new Exception($"Failed to scrape for {symbol}");
//          }
//        }
//        else
//        {
//          throw new Exception($"Failed to scrape for {symbol}");
//        }
//      }

//    }

//    public Task<double> GetStockPriceNowAsync(string symbol)
//    {
//      return Task.FromResult(GetStockPriceNow(symbol));
//    }
//  }
//}
