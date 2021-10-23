namespace BudgetOracle.Auth
{
  public struct AuthResult
  {
    public AuthResultType Type { get; set; }
    public string token { get; set; }
  }

  public enum AuthResultType
  {
    SUCCESS,
    BAD_PASSWORD,
    NO_SUCH_USER
  }
}
