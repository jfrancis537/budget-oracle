import { GetStockPriceNow } from "../../APIs/StockAPI";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { Investment } from "../Models/Investment";
import { AppStateManager } from "./AppStateManager";

class InvestmentCalculationManager {
  public readonly oninvestmentvaluecalculated: Action<{ id: string, value: number }>
  private readonly calculations: Map<string, number>;
  private didInitalCalculations: boolean;

  constructor() {
    this.oninvestmentvaluecalculated = new Action();
    this.calculations = new Map();
    this.didInitalCalculations = false;

    AppStateManager.oninvestmentsupdated.addListener(this.handleInvestmentsUpdated)
    AppStateManager.onspecificinvestmentupdated.addListener(this.refreshSymbol);
  }

  @autobind
  private async handleInvestmentsUpdated(investments: Iterable<Investment>) {
    if (!this.didInitalCalculations) {
      for (let investment of investments) {
        await this.calculateInvestment(investment);
      }
      this.didInitalCalculations = true;
    }
  }

  @autobind
  public getExistingCalculation(id: string) {
    return this.calculations.get(id);
  }

  @autobind
  public async refreshSymbol(investment: Investment) {
    await this.calculateInvestment(investment);
  }

  private async calculateInvestment(investment: Investment) {
    let price = await GetStockPriceNow(investment.symbol);
    let calculation = (price ?? investment.costBasisPerShare) * investment.shares;
    this.calculations.set(investment.id, calculation);
    this.oninvestmentvaluecalculated.invoke({ id: investment.id, value: calculation });
  }

}
let instance = new InvestmentCalculationManager();
export { instance as InvestmentCalculationManager }