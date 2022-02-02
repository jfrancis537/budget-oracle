using BudgetOracle.Models;
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
