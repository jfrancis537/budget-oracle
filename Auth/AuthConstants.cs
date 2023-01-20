using BudgetOracle.Cryptography;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace BudgetOracle.Auth
{
  public class AuthConstants
  {
    private static SecurityKey PrivateKey_ = CryptographyHelper.GenerateSymmetricKey();
    public static SecurityKey PrivateKey { get { return PrivateKey_; } }
    public static readonly string Issuer = "budgetoracle.net";
    public static readonly string TokenCookieName = "JWTAuthCookie";

    public static readonly string Audience = "BudgetOracleUser";

    public static void InvalidateAllTokens()
    {
      PrivateKey_ = CryptographyHelper.GenerateSymmetricKey();
    }
  }
}
