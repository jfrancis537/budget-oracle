namespace BudgetOracle.Models.Teller
{
  public class TransactionData
  {
    public string Status { get; set; }
    public double Amount { get; set; }
    public string AccountId { get; set; }
    public string Id { get; set; }
    public string Type { get; set; }
    public string Date { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
  }
}
