using BudgetOracle.Models;
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
    Task UpdateInvestmentGroups(string username, string data);
    Task UpdateCategoryData(string username, string data);
    Task SetPassword(string username, string password);
    Task<bool> ContainsUser(string username);
    Task SetTellerUserId(string username, string id);
    Task<LinkedAccountDetails> AddLinkedAccount(string username, LinkedAccountDetails linkedAccount);
    Task<LinkedAccountDetails> GetLinkedAccount(string userId, string accountId);
    Task<LinkedAccountDetails> DeleteLinkedAccount(string userId, string accountId);
    Task<List<LinkedAccountDetails>> GetAllLinkedAccountDetails(string username);
  }
}
