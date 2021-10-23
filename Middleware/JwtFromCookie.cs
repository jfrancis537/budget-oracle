using Azure.Core;
using BudgetOracle.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace BudgetOracle.Middleware
{
  public class JwtFromCookie
  {
    private readonly RequestDelegate _next;

    public JwtFromCookie(RequestDelegate next)
    {
      _next = next;
    }

    public async Task Invoke(HttpContext httpContext)
    {
      var isAuthorized = httpContext.Request.Cookies.ContainsKey(AuthConstants.TokenCookieName);
      if(isAuthorized)
      {
        var token = httpContext.Request.Cookies[AuthConstants.TokenCookieName];
        httpContext.Request.Headers.Add(HttpHeader.Names.Authorization, $"Bearer {token}");
      }
      await _next(httpContext);
    }
  }

  // Extension method used to add the middleware to the HTTP request pipeline.
  public static class JwtFromCookieExtensions
  {
    public static IApplicationBuilder UseJwtFromCookie(this IApplicationBuilder builder)
    {
      return builder.UseMiddleware<JwtFromCookie>();
    }
  }
}
