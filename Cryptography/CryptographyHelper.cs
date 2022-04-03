using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Security.Cryptography;
using System.Text;

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
      byte[] salt = new byte[128 / 8];
      using var rngCsp = new RNGCryptoServiceProvider();
      rngCsp.GetNonZeroBytes(salt);
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

    public static Guid CreateGuidFromString(string input)
    {
      using var sha256 = SHA256.Create();
      byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
      Array.Resize(ref hash, 16);
      return new Guid(hash);
    }
  }
}
