using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public class InMemoryUserDatabase : IUserDatabase
  {
    private readonly ConcurrentDictionary<string, User> database;
    private readonly ConcurrentDictionary<string, List<Enrollment>> enrollments;

    public InMemoryUserDatabase()
    {
      database = new ConcurrentDictionary<string, User>();
      enrollments = new ConcurrentDictionary<string, List<Enrollment>>();
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

    public async Task<List<Enrollment>> GetEnrollmentsForUser(string username)
    {
      var has = enrollments.TryGetValue(username, out var result);
      return has ? await Task.FromResult(result) : new List<Enrollment>();
    }

    public async Task<Enrollment> AddEnrollment(Enrollment enrollment)
    {
      if (!enrollments.ContainsKey(enrollment.OwnerUsername))
      {
        enrollments[enrollment.OwnerUsername] = new List<Enrollment>();
      }
      enrollments[enrollment.OwnerUsername].Add(enrollment);
      return await Task.FromResult(enrollment);
    }

    public async Task SetTellerUserId(string username, string id)
    {
      var user = await GetUser(username);
      if (user != null)
      {
        user.TellerUserId = id;
        database[username] = user;
      }
      else
      {
        throw new InvalidOperationException("Can not update teller user id of user that does not exist");
      }
    }

    public async Task<Enrollment> GetEnrollment(string username, string id)
    {
      var has = enrollments.TryGetValue(username, out var ownedEnrollments);
      if (has)
      {
        return await Task.FromResult(ownedEnrollments.Find((e) => e.EnrollmentId == id));
      }
      else
      {
        return null;
      }
    }
  }
}
