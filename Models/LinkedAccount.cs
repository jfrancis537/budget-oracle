namespace BudgetOracle.Models
{
  public class LinkedAccount
  {
    public string Name { get; set; }
    public double Amount { get; set; }
    public string EnrollmentId { get; set; }
    public LinkedAccountType Type { get; set; }
  }

  public enum LinkedAccountType
  {
    BANK,
    CREDIT
  }
}
