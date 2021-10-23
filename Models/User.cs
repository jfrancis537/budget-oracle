using System;

namespace BudgetOracle.Models
{
  public class User
  {
    public string Username { get; set; }
    public string Password { get; set; }
    public string Salt { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public BudgetData BudgetData { get; set; }
  }
}
