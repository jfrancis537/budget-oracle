using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace BudgetOracle.Extensions.Http
{
  public static class HttpRequestMessageExtensions
  {
    public static async Task<HttpRequestMessage> CloneAsync(this HttpRequestMessage request)
    {
      var clone = new HttpRequestMessage(request.Method, request.RequestUri)
      {
        Content = await request.Content.CloneAsync().ConfigureAwait(false),
        Version = request.Version
      };
      foreach (KeyValuePair<string, object> prop in request.Options)
      {
        clone.Options.TryAdd(prop.Key,prop.Value);
      }
      foreach (KeyValuePair<string, IEnumerable<string>> header in request.Headers)
      {
        clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
      }

      return clone;
    }
  }
}
