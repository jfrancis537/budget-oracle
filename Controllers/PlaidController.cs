using Going.Plaid;
using Going.Plaid.Link;
using Going.Plaid.Item;
using Going.Plaid.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using BudgetOracle.Storage;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace BudgetOracle.Controllers
{
  [Route("api/plaid")]
  [ApiController]
  public class PlaidController : ControllerBase
  {
    private readonly PlaidClient plaidClient;
    private readonly IUserDatabase database;
    public PlaidController(PlaidClient plaidClient, IUserDatabase database)
    {
      this.plaidClient = plaidClient;
      this.database = database;
    }

    [HttpPost]
    [Route("create/link_token")]
    [Authorize]
    public async Task<IActionResult> GetLinkToken()
    {
      var userId = Cryptography.CryptographyHelper.CreateGuidFromString(User.Identity.Name);
      var request = new LinkTokenCreateRequest()
      {
        User = new LinkTokenCreateRequestUser() { ClientUserId = userId.ToString() },
        ClientName = "Budget Oracle",
        Language = Language.English,
        Products = new List<Products>() { Products.Auth },
        CountryCodes = new List<CountryCode>() { CountryCode.Us }
      };
      var tokenResponse = await plaidClient.LinkTokenCreateAsync(request);
      if (tokenResponse.IsSuccessStatusCode)
      {
        return Ok(tokenResponse.LinkToken);
      }
      else
      {
        return BadRequest();
      }
    }

    [HttpPost]
    [Route("exchange/public_token")]
    [Authorize]
    public async Task<IActionResult> ExchangePublicToken([FromBody] JObject body)
    {
      try
      {
        var publicToken = body["public_token"].ToString();
        var req = new ItemPublicTokenExchangeRequest()
        {
          PublicToken = publicToken
        };
        var response = await plaidClient.ItemPublicTokenExchangeAsync(req);
        if (response.IsSuccessStatusCode)
        {
          await database.SetAccessToken(User.Identity.Name, response.ItemId, response.AccessToken);
          //Created
          return Created($"/api/plaid/get/{response.ItemId}/balance", response.ItemId);
        }
        else
        {
          return BadRequest();
        }
      }
      catch (JsonSerializationException)
      {
        return BadRequest();
      }
    }

    [HttpGet]
    [Route("get/{itemId}/balance")]
    [Authorize]
    public async Task<IActionResult> GetBalance(string itemId)
    {
      var accessToken = await database.GetAccessToken(User.Identity.Name, itemId);
      if (accessToken != null)
      {
        var balanceResponse = await plaidClient.AccountsBalanceGetAsync(new()
        {
          AccessToken = accessToken.Token
        });
        if (balanceResponse.IsSuccessStatusCode)
        {
          return Ok(balanceResponse.Accounts);
        }
        else
        {
          return BadRequest();
        }
      }
      else
      {
        return NotFound();
      }
    }

    [HttpGet]
    [Route("get/items")]
    [Authorize]
    public async Task<IActionResult> GetExistingItems()
    {
      var items = await database.GetAllItemsForUser(User.Identity.Name);
      return Ok(items);
    }
  }
}
