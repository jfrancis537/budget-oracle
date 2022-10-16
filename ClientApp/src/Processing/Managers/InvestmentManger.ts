import { GetStockPriceNow } from "../../APIs/StockAPI";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { Investment } from "../Models/Investment";
import { AppStateManager } from "./AppStateManager";

class InvestmentManager {
  public readonly oninvestmentvaluecalculated: Action<{ id: string, value: number }>
  public readonly onsymbolvaluecalculated: Action<{ symbol: string, value: number }>
  private readonly calculations: Map<string, number>;
  private readonly symbolPrices: Map<string, number>;

  private didInitalCalculations: boolean;

  constructor() {
    this.oninvestmentvaluecalculated = new Action();
    this.onsymbolvaluecalculated = new Action();

    this.calculations = new Map();
    this.symbolPrices = new Map();
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
  public async refreshSymbol(investment: Investment, force = false) {
    await this.calculateInvestment(investment, force);
  }


  public async getStockPriceForSymbol(symbol: string, refresh = false) {
    const symbolKey = symbol.toLowerCase();
    if (!this.symbolPrices.has(symbolKey) || refresh) {
      const price = await GetStockPriceNow(symbol);
      if (price !== undefined) {
        this.onsymbolvaluecalculated.invoke({
          symbol: symbolKey,
          value: price
        });
        this.symbolPrices.set(symbolKey, price);
      }
      return price;
    } else {
      return this.symbolPrices.get(symbolKey)!;
    }
  }

  private async calculateInvestment(investment: Investment, refresh = false) {
    let price = await this.getStockPriceForSymbol(investment.symbol, refresh);
    let calculation = (price ?? investment.costBasisPerShare) * investment.shares;
    calculation -= investment.marginDebt;
    this.calculations.set(investment.id, calculation);
    this.oninvestmentvaluecalculated.invoke({ id: investment.id, value: calculation });
  }

}

const instance = new InvestmentManager();
export { instance as InvestmentManager }