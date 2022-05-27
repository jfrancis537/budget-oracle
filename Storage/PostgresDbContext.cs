using BudgetOracle.Models;
using BudgetOracle.Models.Teller;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using System;

namespace BudgetOracle.Storage
{
  public class PostgresUserDbContext : DbContext
  {
    public PostgresUserDbContext(DbContextOptions<PostgresUserDbContext> options) : base(options)
    {
      try
      {
        var dbCreator = Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
        dbCreator.CreateTables();
      }
      catch (Exception ex)
      {
        Console.WriteLine(ex.GetType().FullName);
      }

    }
    public DbSet<User> Users { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
  }
}
