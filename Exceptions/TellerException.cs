using System;

namespace BudgetOracle.Exceptions
{
  public class TellerException : Exception
  {
    public readonly int StatusCode;
    public TellerException(string message, int statusCode) : base(message)
    {
      StatusCode = statusCode;
    }
  }
}
