using BudgetOracle.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public class MongoUserDatabase : IUserDatabase
  {
    public Task<bool> ContainsUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task<User> CreateUser(User user)
    {
      throw new System.NotImplementedException();
    }

    public Task<AccessToken> GetAccessToken(string username, string itemGuid)
    {
      throw new System.NotImplementedException();
    }

    public Task<IEnumerable<string>> GetAllItemsForUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task<User> GetUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task<AccessToken> SetAccessToken(string username, string itemGuid, string accessToken)
    {
      throw new System.NotImplementedException();
    }

    public Task SetPassword(string username, string password)
    {
      throw new System.NotImplementedException();
    }

    public Task UpdateAlphaVantageKey(string username, string key)
    {
      throw new System.NotImplementedException();
    }

    public Task UpdateGroups(string username, string data)
    {
      throw new System.NotImplementedException();
    }

    public Task UpdateState(string username, string data)
    {
      throw new System.NotImplementedException();
    }
  }
}
