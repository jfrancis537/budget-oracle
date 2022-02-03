using BudgetOracle.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using WebPush;

namespace BudgetOracle_.Controllers
{
  [Route("api/notifications")]
  [ApiController]
  public class PushNotificationController : ControllerBase
  {
    private readonly PushNotificationService notificationService;
    public PushNotificationController(PushNotificationService notificationService)
    {
      this.notificationService = notificationService;
    }

    [HttpDelete]
    [Route("unsubscribe")]
    [Authorize]
    public IActionResult Unsubscribe(JObject body)
    {
      try
      {
        var endpoint = body["subscription"]["endpoint"].ToString();
        var removed = notificationService.DeleteSubscription(endpoint);
        if (removed)
        {
          return Accepted();
        }
        else
        {
          return StatusCode(304); //Not Modified
        }

      }
      catch
      {
        return BadRequest("Push Subscription is invalid in request payload");
      }
    }

    [HttpPost]
    [Route("subscribe")]
    [Authorize]
    public IActionResult Subscribe(JObject body)
    {
      try
      {
        var subscriptionObj = body["subscription"];
        var keys = subscriptionObj["keys"];
        var subscription = new PushSubscription()
        {
          Endpoint = subscriptionObj["endpoint"].ToString(),
          Auth = keys["auth"].ToString(),
          P256DH = keys["p256dh"].ToString()
        };
        var added = notificationService.AddSubscription(subscription);
        if (added)
        {
          return Accepted();
        }
        else
        {
          return StatusCode(304);
        }
      }
      catch
      {
        return BadRequest("Push Subscription is invalid in request payload");
      }
    }

    [HttpGet]
    [Route("publickey")]
    [Authorize]
    public IActionResult GetVapidPublicKey()
    {
      return Content(notificationService.GetPublicKey(), "application/json");
    }

    [HttpGet]
    [Route("sample/{message}")]
    [Authorize]
    public void SendNotification(string message)
    {
      notificationService.SendNotification(message);
    }
  }
}
