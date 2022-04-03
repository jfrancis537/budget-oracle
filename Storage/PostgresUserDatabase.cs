using BudgetOracle.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{

  public class PostgresUserDatabase : IUserDatabase
  {
    private PostgresUserDbContext dbContext;
    public PostgresUserDatabase(PostgresUserDbContext dbContext)
    {
      this.dbContext = dbContext;
    }

    public async Task<bool> ContainsUser(string username)
    {
      return (await GetUser(username)) != null;
    }

    public async Task<User> CreateUser(User user)
    {
      var result = await dbContext.AddAsync(user);
      await dbContext.SaveChangesAsync();
      return result.Entity;
    }

    public async Task<User> GetUser(string username)
    {
      return await dbContext.FindAsync<User>(username);
    }

    public async Task<AccessToken> SetAccessToken(string username, string itemGuid, string accessToken)
    {
      var user = await GetUser(username);
      AccessToken result = null;
      if (user != null)
      {
        var entity = await dbContext.AddAsync(new AccessToken()
        {
          ItemId = itemGuid,
          Token = accessToken,
          OwnerUsername = user.Username,
        });
        await dbContext.SaveChangesAsync();
        result = entity.Entity;
      }
      return result;
    }

    public async Task<AccessToken> GetAccessToken(string username, string itemGuid)
    {
      var user = await GetUser(username);
      AccessToken result = null;
      if (user != null)
      {
        result = await dbContext.FindAsync<AccessToken>(user.Username, itemGuid);
      }
      return result;
    }

    public async Task SetPassword(string username, string password)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.Password = password;
        dbContext.Update(user);
      }
      await dbContext.SaveChangesAsync();
    }

    public async Task UpdateGroups(string username, string data)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.GroupData = data;
        dbContext.Update(user);
      }
      await dbContext.SaveChangesAsync();
    }

    public async Task UpdateState(string username, string data)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.StateData = data;
        dbContext.Update(user);
      }
      await dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<string>> GetAllItemsForUser(string username)
    {
      var user = await GetUser(username);
      IEnumerable<string> result = Array.Empty<string>();
      if (user != null)
      {
        result = dbContext.AccessTokens.Where(token => token.OwnerUsername == username).Select(token => token.ItemId);
      }
      return result;
    }
  }
}
