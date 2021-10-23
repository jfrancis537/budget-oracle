using BudgetOracle.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BudgetOracle.Controllers
{
  [Route("api/auth")]
  [ApiController]
  [Authorize]
  public class AuthController : ControllerBase
  {

    private readonly IAuthFactory authFactory;
    public AuthController(IAuthFactory authFactory)
    {
      this.authFactory = authFactory;
    }

    [HttpGet]
    [Route("username")]
    [Authorize]
    public IActionResult GetUsername()
    {
      return Ok(User.Identity.Name);
    }

    [HttpPut]
    [Route("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegistrationRequest request)
    {
      IActionResult result;
      var password = request.Password;
      var username = request.Username;
      var confirmPassword = request.ConfirmPassword;
      if (confirmPassword != password)
      {
        result = BadRequest("Passwords didn't match.");
      }
      else
      {
        if (password.Length > 256)
        {
          result = BadRequest("Password should not be longer than 256 characters.");
        }
        else if (password.Length < 12)
        {
          result = BadRequest("Password should be at least 12 characters.");
        }
        else if (username.Length < 4)
        {
          result = BadRequest("Username must be at least 4 characters");
        }
        else
        {
          var user = await authFactory.CreateUser(username, password);
          result = Ok(user.CreatedDate);
        }
      }
      return result;
    }

    [HttpPost]
    [Route("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(UsernamePassword details)
    {
      var result = await authFactory.Login(details.Username, details.Password);
      if (result.Type == AuthResultType.SUCCESS)
      {
        Response.Cookies.Append(AuthConstants.TokenCookieName, result.token, new CookieOptions
        {
          HttpOnly = true,
          Secure = true,
          IsEssential = true
        });
        return Ok();
      }
      else
      {
        return Unauthorized();
      }
    }

    [HttpGet]
    [Route("logout")]
    public IActionResult Logout()
    {
      Response.Cookies.Delete(AuthConstants.TokenCookieName);
      return Ok();
    }
  }

  public class UsernamePassword
  {
    public string Password { get; set; }
    public string Username { get; set; }
  }

  public class RegistrationRequest : UsernamePassword
  {
    public string ConfirmPassword { get; set; }
  }

}
