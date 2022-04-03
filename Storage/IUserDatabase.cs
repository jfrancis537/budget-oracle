using BudgetOracle.Models;
using System.Collections.Generic;
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
    Task<AccessToken> SetAccessToken(string username, string itemGuid, string accessToken);
    Task<AccessToken> GetAccessToken(string username, string itemGuid);
    Task<IEnumerable<string>> GetAllItemsForUser(string username);
    Task<bool> ContainsUser(string username);
  }
}
