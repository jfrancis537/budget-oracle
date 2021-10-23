using BudgetOracle.Models;
using System.Threading.Tasks;

namespace BudgetOracle.Auth
{
  public interface IAuthFactory
  {
    Task<AuthResult> Login(string username, string password);
    Task<User> CreateUser(string username, string password);
  }
}
