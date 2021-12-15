using BudgetOracle_.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public IActionResult GetStockPriceNow(string symbol)
    {
      try
      {
        var price = stockDataProvider.GetStockPriceNow(symbol);
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
        return BadRequest("Invalid symbol");
      }
    }
  }
}
