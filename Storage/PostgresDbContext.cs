using BudgetOracle.Models;
using Microsoft.EntityFrameworkCore;

namespace BudgetOracle.Storage
{
  public class PostgresUserDbContext : DbContext
  {
    public PostgresUserDbContext(DbContextOptions<PostgresUserDbContext> options) : base(options)
    {

    }
    public DbSet<User> Users { get; set; }
  }
}
