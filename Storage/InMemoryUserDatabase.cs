using BudgetOracle.Models;
using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public class InMemoryUserDatabase : IUserDatabase
  {
    private readonly ConcurrentDictionary<string, User> database;

    public InMemoryUserDatabase()
    {
      database = new ConcurrentDictionary<string, User>();
    }

    public async Task<bool> ContainsUser(string username)
    {
      await Task.CompletedTask;
      return database.ContainsKey(username);
    }

    public async Task<User> CreateUser(User user)
    {
      await Task.CompletedTask;
      if (database.ContainsKey(user.Username))
      {
        throw new InvalidOperationException("Can not create a user that already exists.");
      }
      else
      {
        database.TryAdd(user.Username, user);
        return user;
      }
    }

    public async Task<User> GetUser(string username)
    {
      await Task.CompletedTask;
      bool exists = database.TryGetValue(username, out User user);
      if (exists)
      {
        return user;
      }
      else
      {
        return null;
      }

    }

    public async Task SetPassword(string username, string password)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.Password = password;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not set password of a user that does not exist");
      }
    }

    public async Task UpdateAlphaVantageKey(string username, string key)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.AlphaVantageKey = key;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not set API key of a user that does not exist");
      }
    }

    public async Task UpdateState(string username, string state)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var data = user.BudgetData;
        data.StateData = state;
        user.BudgetData = data;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update state of user that does not exist");
      }
    }

    public async Task UpdateGroups(string username, string groups)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var data = user.BudgetData;
        data.GroupData = groups;
        user.BudgetData = data;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update groups of user that does not exist");
      }
    }
  }
}
