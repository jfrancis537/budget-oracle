using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public class MongoUserDatabase : IUserDatabase
  {
    public Task<Enrollment> AddEnrollment(Enrollment enrollment)
    {
      throw new System.NotImplementedException();
    }

    public Task<bool> ContainsUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task<User> CreateUser(User user)
    {
      throw new System.NotImplementedException();
    }

    public Task<Enrollment> GetEnrollment(string username, string id)
    {
      throw new System.NotImplementedException();
    }

    public Task<List<Enrollment>> GetEnrollmentsForUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task<User> GetUser(string username)
    {
      throw new System.NotImplementedException();
    }

    public Task SetPassword(string username, string password)
    {
      throw new System.NotImplementedException();
    }

    public Task SetTellerUserId(string username, string id)
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
