using BudgetOracle.Cryptography;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace BudgetOracle.Auth
{
  public class AuthConstants
  {
    public static readonly SecurityKey PrivateKey = CryptographyHelper.GenerateSymmetricKey();
    public static readonly string Issuer = "jfrancis.us:BudgetOracle";
    public static readonly string TokenCookieName = "JWTAuthCookie";

    public static readonly string Audience = "BudgetOracleUser";
  }
}
