using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetOracle.Models
{
  public class AccessToken
  {
    [Key, Column("owner_username", Order = 0)]
    public string OwnerUsername { get; set; }
    [Key, Column("item_id", Order = 1)]
    public string ItemId { get; set; }
    public string Token { get; set; }
  }
}
