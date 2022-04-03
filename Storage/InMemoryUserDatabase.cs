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
    private readonly ConcurrentDictionary<string, AccessToken> tokens;

    public InMemoryUserDatabase()
    {
      database = new ConcurrentDictionary<string, User>();
      tokens = new ConcurrentDictionary<string, AccessToken>();
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

    public async Task<AccessToken> SetAccessToken(string username, string itemGuid, string accessToken)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var key = $"{user.Username}-{itemGuid}";
        var token = new AccessToken()
        {
          OwnerUsername = user.Username,
          Token = accessToken,
          ItemId = itemGuid
        };
        tokens[key] = token;
        return token;
      }
      else
      {
        throw new InvalidOperationException("Can't create access token for user that does not exist.");
      }
    }

    public async Task<AccessToken> GetAccessToken(string username, string itemGuid)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var key = $"{user.Username}-{itemGuid}";
        return tokens.GetValueOrDefault(key, null);
      }
      else
      {
        throw new InvalidOperationException("Can't create access token for user that does not exist.");
      }
    }

    public async Task<IEnumerable<string>> GetAllItemsForUser(string username)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var result = tokens.Values.Where(token => token.OwnerUsername == username).Select(token => token.ItemId);
        return result;
      }
      else
      {
        throw new InvalidOperationException("Can't get items for a user that does not exist");
      }
    }
  }
}
