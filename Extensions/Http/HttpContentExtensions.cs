using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace BudgetOracle.Extensions.Http
{
  public static class HttpContentExtensions
  {
    public static async Task<HttpContent> CloneAsync(this HttpContent content)
    {
      if (content == null) return null;

      var ms = new MemoryStream();
      await content.CopyToAsync(ms).ConfigureAwait(false);
      ms.Position = 0;

      var clone = new StreamContent(ms);
      foreach (KeyValuePair<string, IEnumerable<string>> header in content.Headers)
      {
        clone.Headers.Add(header.Key, header.Value);
      }
      return clone;
    }
  }
}
