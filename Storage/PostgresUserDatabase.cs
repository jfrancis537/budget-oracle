using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
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

    public async Task<Enrollment> AddEnrollment(Enrollment enrollment)
    {
      var user = await GetUser(enrollment.OwnerUsername);
      Enrollment result = null;
      if (user != null)
      {
        var entity = await dbContext.AddAsync(enrollment);
        await dbContext.SaveChangesAsync();
        result = entity.Entity;
      }
      return result;
    }

    public async Task<Enrollment> GetEnrollment(string username, string id)
    {
      var user = await GetUser(username);
      Enrollment result = null;
      if (user != null)
      {
        result = await dbContext.FindAsync<Enrollment>(username, id);
        
      }
      return result;
    }

    public async Task<List<Enrollment>> GetEnrollmentsForUser(string username)
    {
      var user = await GetUser(username);
      var result = new List<Enrollment>();
      if (user != null)
      {
        result = await dbContext.Enrollments.Where(enrollment => enrollment.OwnerUsername == user.Username).ToListAsync();
      }
      return result;
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
