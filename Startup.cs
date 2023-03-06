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
using Microsoft.EntityFrameworkCore;
using BudgetOracle.Configuration;
using BudgetOracle.Services;
using BudgetOracle.Constants;
using System.Security.Cryptography.X509Certificates;
using System.Net.Http;
using BudgetOracle.Models.Configuration;
using Microsoft.Extensions.Options;
using BudgetOracle.Providers;

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
      services.Configure<PushNotificationConfiguration>(Configuration.GetSection("Credentials"));
      var password = Configuration.GetSection("Credentials:PostgresPassword").Get<string>();
      services.AddControllers().AddNewtonsoftJson();
      services.AddDbContext<PostgresUserDbContext>(options =>
      {
        options
        .UseNpgsql($"Host=localhost;Database=budget_oracle;Username=www-data;Password={password}")
        .UseSnakeCaseNamingConvention();
      });
      services.AddLogging();

      if (Environment.IsDevelopment())
      {
        services.AddSingleton<IUserDatabase, InMemoryUserDatabase>();
      }
      else
      {
        services.AddScoped<IUserDatabase, PostgresUserDatabase>();
      }
      services.Configure<TellerConfiguration>(Configuration.GetSection("Teller"));
      services.AddHttpClient();
      services.AddHttpClient(TellerConstants.TellerHttpClientName)
               .ConfigurePrimaryHttpMessageHandler((provider) =>
               {
                 var conf = provider.GetService<IOptions<TellerConfiguration>>();
                 var cert = X509Certificate2.CreateFromPemFile(conf.Value.SSLCertPath, conf.Value.SSLKeyPath);
                 if (OperatingSystem.IsWindows())
                 {
                   cert = new X509Certificate2(cert.Export(X509ContentType.Pfx));
                 }
                 var handler = new HttpClientHandler();
                 handler.ClientCertificates.Add(cert);
                 return handler;
               });
      services.AddSingleton<IAuthFactory, AuthFactory>();
      services.AddSingleton<IStockDataProvider, YahooFinanceAPIProvider>();
      services.AddAntiforgery();
      services.AddSingleton<PushNotificationService>();
      services.AddSingleton<TellerProvider>();
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
