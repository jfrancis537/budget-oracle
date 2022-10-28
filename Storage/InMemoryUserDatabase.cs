using BudgetOracle.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public class InMemoryUserDatabase : IUserDatabase
  {
    private readonly ConcurrentDictionary<string, User> database;
    private readonly ConcurrentDictionary<string, List<LinkedAccountDetails>> accounts;

    public InMemoryUserDatabase()
    {
      database = new ConcurrentDictionary<string, User>();
      accounts = new ConcurrentDictionary<string, List<LinkedAccountDetails>>();
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

    public async Task UpdateState(string username, string state)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.StateData = state;
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
        user.GroupData = groups;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update groups of user that does not exist");
      }
    }

    public async Task UpdateInvestmentGroups(string username, string groups)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.InvestmentGroupData = groups;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update groups of user that does not exist");
      }
    }

    public async Task UpdateCategoryData(string username, string data)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.CategoryData = data;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update groups of user that does not exist");
      }
    }

    public Task SetTellerUserId(string username, string id)
    {
      var has = database.TryGetValue(username, out var user);
      if (has)
      {
        user.TellerUserId = id;
      }
      return Task.CompletedTask;
    }

    public async Task<LinkedAccountDetails> AddLinkedAccount(string username, LinkedAccountDetails linkedAccount)
    {
      if (!accounts.ContainsKey(linkedAccount.UserId))
      {
        accounts[linkedAccount.UserId] = new List<LinkedAccountDetails>();
      }
      accounts[linkedAccount.UserId].Add(linkedAccount);
      return await Task.FromResult(linkedAccount);
    }

    public async Task<List<LinkedAccountDetails>> GetAllLinkedAccountDetails(string username)
    {
      var user = await GetUser(username);
      if (user != null && user.TellerUserId != null)
      {
        var has = accounts.TryGetValue(user.TellerUserId, out var linkedAccounts);
        return has ? linkedAccounts : null;
      }
      else
      {
        return null;
      }
    }

    public Task<LinkedAccountDetails> GetLinkedAccount(string userId, string accountId)
    {
      if (accounts.ContainsKey(userId))
      {
        return Task.FromResult(accounts[userId].FirstOrDefault(account => account.Id == accountId));
      }
      return null;
    }

    public async Task<LinkedAccountDetails> DeleteLinkedAccount(string userId, string accountId)
    {
      LinkedAccountDetails result = await GetLinkedAccount(userId,accountId);
      if(accounts.ContainsKey(userId))
      {
        accounts[userId].Remove(result);
      }
      return result;
    }

  }
}
