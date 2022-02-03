using BudgetOracle.Configuration;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using System.Net;
using System.Threading.Tasks;
using WebPush;

namespace BudgetOracle.Services
{
  public class PushNotificationService
  {
    private readonly PushNotificationConfiguration configuration;
    private readonly VapidDetails vapidDetails;
    private readonly ConcurrentDictionary<string, PushSubscription> subscriptions;
    public PushNotificationService(IOptions<PushNotificationConfiguration> configuration)
    {
      this.configuration = configuration.Value;
      this.vapidDetails = new VapidDetails(
        "mailto:jfrancis537@gmail.com",
        this.configuration.VapidPublicKey,
        this.configuration.VapidPrivateKey
      );
      this.subscriptions = new ConcurrentDictionary<string, PushSubscription>();
    }

    public string GetPublicKey()
    {
      return vapidDetails.PublicKey;
    }

    public bool DeleteSubscription(string endpoint)
    {
      return subscriptions.TryRemove(endpoint, out _);
    }

    public bool AddSubscription(PushSubscription subscription)
    {
      return subscriptions.TryAdd(subscription.Endpoint, subscription);
    }

    public void SendNotification(string message)
    {
      WebPushClient client = new WebPushClient();
      var payload = new { title = "Example Notification", message };
      Parallel.ForEach(this.subscriptions.Values, (subscription) =>
      {
        try
        {
          client.SendNotification(subscription, JsonConvert.SerializeObject(payload), vapidDetails);
        }
        catch (WebPushException ex) when (ex.StatusCode == HttpStatusCode.Gone)
        {
          subscriptions.TryRemove(subscription.Endpoint, out _);
        }
      });
    }
  }
}
