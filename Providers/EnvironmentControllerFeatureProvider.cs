using Microsoft.AspNetCore.Mvc.Controllers;
using System.Collections.Generic;
using System.Reflection;

namespace BudgetOracle.Providers
{
    public class EnvironmentControllerFeatureProvider: ControllerFeatureProvider
    {
    private readonly HashSet<string> controllers;
    public EnvironmentControllerFeatureProvider(HashSet<string> controllers)
    {
      this.controllers = controllers;
    }

    protected override bool IsController(TypeInfo typeInfo)
    {
      if (controllers.Contains(typeInfo.Name))
      {
        return false;
      }
      return base.IsController(typeInfo);
    }
  }
}
