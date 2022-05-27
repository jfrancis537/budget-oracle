using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetOracle.Models.Teller
{
  public class Enrollment
  {
    [Key, Column("owner_username", Order = 0)]
    public string OwnerUsername { get; set; }
    [Column("access_token")]
    public string AccessToken { get; set; }
    [Column("teller_user_id")]
    public string TellerUserId { get; set; }
    [Key,Column("enrollment_id")]
    public string EnrollmentId { get; set; }
    [Column("institution_name")]
    public string InstitutionName { get; set; }
    [Column("signatures")]
    public List<string> Signatures { get; set; }
  }
}
