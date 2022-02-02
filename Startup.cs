using BudgetOracle.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using BudgetOracle.Auth;
using BudgetOracle.Middleware;
using BudgetOracle_.Providers;
using Microsoft.AspNetCore.Http;
using System;
using Microsoft.Net.Http.Headers;

namespace BudgetOracle
{
  public class Startup
  {
    public Startup(IConfiguration configuration, IWebHostEnvironment env)
    {
      Configuration = configuration;
      Environment = env;
    }

    public IConfiguration Configuration { get; }
    public IWebHostEnvironment Environment { get; }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {

      services.AddControllers().AddNewtonsoftJson();
      services.AddDbContext<PostgresUserDbContext>();
      if (Environment.IsDevelopment())
      {
        services.AddSingleton<IUserDatabase, InMemoryUserDatabase>();
      }
      else
      {
        //services.AddSingleton<IUserDatabase, MongoUserDatabase>();
        services.AddSingleton<IUserDatabase, PostgresUserDatabase>();
      }
      services.AddHttpClient();
      services.AddSingleton<IAuthFactory, AuthFactory>();
      services.AddSingleton<IStockDataProvider, YahooFinanceAPIProvider>();
      services.AddAntiforgery();
      services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
      {
        options.TokenValidationParameters = new TokenValidationParameters
        {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = AuthConstants.Issuer,
          ValidAudience = AuthConstants.Audience,
          IssuerSigningKey = AuthConstants.PrivateKey
        };

        options.Audience = AuthConstants.Audience;
      });
      // In production, the React files will be served from this directory
      services.AddSpaStaticFiles(configuration =>
      {
        configuration.RootPath = "ClientApp/build";
      });
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
      if (env.IsDevelopment())
      {
        app.UseDeveloperExceptionPage();
      }
      else
      {
        app.UseExceptionHandler("/Error");
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
      }
      app.UseStaticFiles();
      app.UseSpaStaticFiles();

      app.UseJwtFromCookie();
      app.UseAuthentication();
      app.UseRouting();
      app.UseAuthorization();

      app.UseEndpoints(endpoints =>
      {
        endpoints.MapControllerRoute(
                  name: "default",
                  pattern: "{controller}/{action=Index}/{id?}");
      });
      app.UseForwardedHeaders(new ForwardedHeadersOptions
      {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
      });

      app.UseSpa(spa =>
      {
        spa.Options.SourcePath = "ClientApp";
        spa.Options.DefaultPageStaticFileOptions = new StaticFileOptions()
        {
          OnPrepareResponse = config =>
          {
            var ctx = config.Context;
            var headers = ctx.Response.GetTypedHeaders();
            headers.CacheControl = new CacheControlHeaderValue
            {
              NoCache = true,
              NoStore = true,
              MustRevalidate = true,
              MaxAge = TimeSpan.Zero
            };
          }
        };
        if (env.IsDevelopment())
        {
          spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
        }
      });
    }
  }
}
