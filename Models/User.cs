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
    [Column("access_tokens")]
    public string AccessTokens { get; set; }
  }
}
