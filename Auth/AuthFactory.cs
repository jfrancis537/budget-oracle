using BudgetOracle.Cryptography;
using BudgetOracle.Models;
using BudgetOracle.Storage;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;

namespace BudgetOracle.Auth
{
  public class AuthFactory : IAuthFactory
  {
    private readonly IUserDatabase userDatabase;
    public AuthFactory(IUserDatabase database)
    {
      userDatabase = database;
    }

    public async Task<AuthResult> Login(string username, string password)
    {
      var user = await userDatabase.GetUser(username);
      if (user == null)
      {
        return new AuthResult
        {
          Type = AuthResultType.NO_SUCH_USER
        };
      }

      var existingHashedPassword = user.Password;
      var providedHashedPassword = CryptographyHelper.HashPassword(password, user.Salt);

      if (existingHashedPassword == providedHashedPassword)
      {
        return new AuthResult
        {
          token = BuildToken(user),
          Type = AuthResultType.SUCCESS
        };
      }
      else
      {
        return new AuthResult
        {
          Type = AuthResultType.BAD_PASSWORD
        };
      }

    }

    public async Task<User> CreateUser(string username, string password)
    {
      var salt = CryptographyHelper.GenerateSalt();
      var hashedPassword = CryptographyHelper.HashPassword(password, salt);
      User user = await userDatabase.CreateUser(new User
      {
        Username = username,
        Password = hashedPassword,
        Salt = salt,
        CreatedDate = DateTimeOffset.UtcNow,
        BudgetData = new BudgetData
        {
          StateData = "",
          GroupData = ""
        }
      });

      return user;
    }
    private string BuildToken(User user)
    {
      var claims = new[] {
            new Claim(ClaimTypes.Name, user.Username)
        };

      var credentials = new SigningCredentials(AuthConstants.PrivateKey, SecurityAlgorithms.HmacSha256Signature);
      var now = DateTimeOffset.UtcNow;
      var tokenDescriptor = new JwtSecurityToken(AuthConstants.Issuer, AuthConstants.Audience, claims, expires: now.AddHours(5).LocalDateTime, signingCredentials: credentials);
      return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    public bool IsTokenValid(string token)
    {
      var tokenHandler = new JwtSecurityTokenHandler();
      try
      {
        tokenHandler.ValidateToken(token,
        new TokenValidationParameters
        {
          ValidateIssuerSigningKey = true,
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidIssuer = AuthConstants.Issuer,
          ValidAudience = AuthConstants.Audience,
          IssuerSigningKey = AuthConstants.PrivateKey,
        }, out SecurityToken validatedToken);
      }
      catch
      {
        return false;
      }
      return true;
    }
  }

}
