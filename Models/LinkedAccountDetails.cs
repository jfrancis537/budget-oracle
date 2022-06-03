using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetOracle.Models
{
  public class LinkedAccountDetails
  {
    [Column("name")]
    public string Name { get; set; }
    [Column("enrollment_id")]
    public string EnrollmentId { get; set; }
    [Key, Column("user_id",Order = 0)]
    public string UserId { get; set; }
    [Column("type")]
    public string Type { get; set; }
    [Column("balance_url")]
    public string BalanceUrl { get; set; }
    [Key,Column("id",Order = 1)]
    public string Id { get; set; }
    [Column("last_four")]
    public string LastFour { get; set; }
    [Column("access_token")]
    public string AccessToken { get; set; }
  }
}
