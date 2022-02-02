using BudgetOracle.Models;
using Microsoft.EntityFrameworkCore;

namespace BudgetOracle.Storage
{
  public class PostgresUserDbContext : DbContext
  {
    public DbSet<User> Users { get; set; }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
      optionsBuilder
        .UseNpgsql("Host=localhost;Database=budget_oracle;Username=www-data")
        .UseSnakeCaseNamingConvention();
    }
  }
}
