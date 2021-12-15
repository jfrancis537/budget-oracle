using BudgetOracle_.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BudgetOracle_.Controllers
{
  [Route("api/stock")]
  [ApiController]
  public class StockController : ControllerBase
  {
    private readonly IStockDataProvider stockDataProvider;
    public StockController(IStockDataProvider stockDataProvider)
    {
      this.stockDataProvider = stockDataProvider;
    }

    [HttpGet]
    [Route("price/{symbol}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStockPriceNowAsync(string symbol)
    {
      try
      {
        var price = await stockDataProvider.GetStockPriceNowAsync(symbol);
        if (price > 0)
        {
          return Ok(price);
        }
        else
        {
          return NotFound();
        }
      }
      catch
      {
        return BadRequest("Invalid stock symbol");
      }
    }
  }
}
