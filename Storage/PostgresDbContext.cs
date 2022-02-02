using BudgetOracle.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace BudgetOracle.Storage
{
  public class PostgresUserDbContext : DbContext
  {
    public PostgresUserDbContext(DbContextOptions<PostgresUserDbContext> options) : base(options)
    {
      var dbCreator = Database.GetService<IDatabaseCreator>() as RelationalDatabaseCreator;
      dbCreator.CreateTables();
    }
    public DbSet<User> Users { get; set; }
  }
}
