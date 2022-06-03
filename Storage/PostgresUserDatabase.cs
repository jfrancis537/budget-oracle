using BudgetOracle.Models;
using Microsoft.EntityFrameworkCore;
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

    public async Task<LinkedAccountDetails> AddLinkedAccount(string username, LinkedAccountDetails linkedAccount)
    {
      var result = await dbContext.Accounts.AddAsync(linkedAccount);
      await dbContext.SaveChangesAsync();
      return result.Entity;
    }

    public async Task<LinkedAccountDetails> GetLinkedAccount(string userId, string accountId)
    {
      var result = await dbContext.Accounts.Where(account => account.Id == accountId && account.UserId == userId).FirstOrDefaultAsync();
      return result;
    }

    public async Task<List<LinkedAccountDetails>> GetAllLinkedAccountDetails(string username)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        var id = user.TellerUserId;
        if (id != null)
        {
          return await dbContext.Accounts.Where(account => account.UserId == id).ToListAsync();
        }
      }
      return null;
    }

    public async Task SetTellerUserId(string username, string id)
    {
      var user = await GetUser(username);
      if (user != null)
      {

        user.TellerUserId = id;
        dbContext.Update(user);
      }
      await dbContext.SaveChangesAsync();
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
  }
}
