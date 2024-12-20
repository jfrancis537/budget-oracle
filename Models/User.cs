﻿using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetOracle.Models
{
  public class User
  {
    [Key]
    [Column("username")]
    public string Username { get; set; }
    [Column("teller_user_id")]
    public string TellerUserId { get; set; }
    [Column("password")]
    public string Password { get; set; }
    [Column("salt")]
    public string Salt { get; set; }
    [Column("created_date")]
    public DateTimeOffset CreatedDate { get; set; }
    [Column("state_data")]
    public string StateData { get; set; }
    [Column("group_data")]
    public string GroupData { get; set; }
    [Column("investment_group_data")]
    public string InvestmentGroupData { get; set; }
    [Column("category_data")]
    public string CategoryData { get; set; }
  }
}
