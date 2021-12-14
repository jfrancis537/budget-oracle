using System.Threading.Tasks;

namespace BudgetOracle_.Providers
{
  public interface IStockDataProvider
  {
    double GetStockPriceNow(string symbol);
  }
}
