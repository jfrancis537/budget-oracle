using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BudgetOracle.Storage
{
  public interface IUserDatabase
  {
    Task<User> GetUser(string username);
    Task<User> CreateUser(User user);
    Task UpdateState(string username, string data);
    Task UpdateGroups(string username, string data);
    Task SetPassword(string username, string password);
    Task<bool> ContainsUser(string username);
    Task<List<Enrollment>> GetEnrollmentsForUser(string username);
    Task<Enrollment> AddEnrollment(Enrollment enrollment);
    Task<Enrollment> GetEnrollment(string username, string id);
    Task SetTellerUserId(string username, string id);
  }
}
