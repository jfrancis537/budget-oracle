using Newtonsoft.Json;
using System.Collections.Generic;

namespace BudgetOracle.Models.Teller
{
  public class Enrollment
  {
    public string AccessToken { get; set; }
    public TellerUser User { get; set; }
    [JsonProperty("enrollment")]
    public EnrollmentData EnrollmentInfo { get; set; }
    public List<string> Signatures { get; set; }

    public class TellerUser
    {
      public string Id { get; set; }
    }

    public class EnrollmentData
    {
      public string Id { get; set; }
      public TellerInstitution Institution { get; set; }
    }

    public class TellerInstitution
    {
      public string Name { get; set; }
    }
  }
}
