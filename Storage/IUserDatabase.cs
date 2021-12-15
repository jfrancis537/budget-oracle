using BudgetOracle.Models;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public interface IUserDatabase
  {
    Task<User> GetUser(string username);
    Task<User> CreateUser(User user);
    Task UpdateState(string username, string data);
    Task UpdateGroups(string username, string data);
    Task SetPassword(string username, string password);
    Task<bool> ContainsUser(string username);
  }
}
