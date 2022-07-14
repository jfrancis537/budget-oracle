using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Security.Cryptography;

namespace BudgetOracle.Cryptography
{
  public class CryptographyHelper
  {
    public static SecurityKey GenerateSymmetricKey()
    {
      Aes aes = Aes.Create();
      aes.GenerateIV();
      aes.GenerateKey();
      return new SymmetricSecurityKey(aes.Key);
    }

    public static string GenerateSalt()
    {
      // generate a 128-bit salt using a cryptographically strong random sequence of nonzero values
      byte[] salt = RandomNumberGenerator.GetBytes(128/2);
      //rngCsp.GetNonZeroBytes(salt);
      return Convert.ToBase64String(salt);
    }

    public static string HashPassword(string password, string salt)
    {
      var saltBytes = Convert.FromBase64String(salt);
      string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
        password: password,
        salt: saltBytes,
        prf: KeyDerivationPrf.HMACSHA256,
        iterationCount: 100000,
        numBytesRequested: 256 / 8
      ));
      return hashed;
    }
  }
}
