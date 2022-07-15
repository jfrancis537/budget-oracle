import moment, { Moment } from "moment";
import { Action } from "../../Utilities/Action";
import { CalculationTools, IncomeResult, VestResult } from "../../Utilities/CalculationTools";
import { Bill } from "../Models/Bill";
import { IncomeSource } from "../Models/IncomeSource";
import { PaymentSchedule } from "../Models/ScheduledPayment";
import { VestSchedule } from "../Models/VestSchedule";
import { AppStateManager } from "./AppStateManager";
import { InvestmentCalculationManager } from "./InvestmentCalculationManager";
import { TellerManager } from "./TellerManager";

export type ResultPair<T, V = number> = [Map<T, V>, number];

export interface InvestmentCalculation {
  totalValue: number;
  totalInterestOwed: number;
  totalCostBasis: number;
  totalUnrealizedLosses: number;
}

export interface BillCalculation {
  allBills: ResultPair<Bill>;
  unavoidableBills: ResultPair<Bill>;
}

export interface LinkedAccountCalculation {
  debt: number,
  accountsValue: number
}

export interface CalculationResult {
  billResults: BillCalculation;
  debtTotal: number;
  accountTotal: number;
  incomeResults: ResultPair<IncomeSource, IncomeResult>;
  investmentResults: InvestmentCalculation;
  scheduledPaymentsResult: ResultPair<PaymentSchedule>;
  scheduledVestsResult: ResultPair<VestSchedule, VestResult>;
  linkedAccountTotal: LinkedAccountCalculation
}

class CalculationsManager {

  public readonly onresultscalculated: Action<CalculationResult>;
  public readonly onenddatechanged: Action<Moment>;

  private _endDate: Moment;

  constructor() {
    this._endDate = moment().startOf('day');
    this.onresultscalculated = new Action();
    this.onenddatechanged = new Action();
    this.handleUpdate = this.handleUpdate.bind(this);
    AppStateManager.onbillsupdated.addListener(this.handleUpdate);
    AppStateManager.onaccountsupdated.addListener(this.handleUpdate);
    AppStateManager.ondebtsupdated.addListener(this.handleUpdate);
    AppStateManager.onincomesourcesupdated.addListener(this.handleUpdate);
    AppStateManager.onpaymentschedulesupdated.addListener(this.handleUpdate);
    TellerManager.onlinkedbalanceupdated.addListener(this.handleUpdate);
    TellerManager.onlinkedtransactionsupdated.addListener(this.handleUpdate);
    InvestmentCalculationManager.oninvestmentvaluecalculated.addListener(this.handleUpdate);
  }

  get endDate() {
    return this._endDate.clone();
  }

  set endDate(date: Moment) {
    this._endDate = date;
    this.handleUpdate();
    this.onenddatechanged.invoke(date);
  }

  public async requestCalculations(): Promise<CalculationResult> {
    const start = moment().startOf('day');
    return CalculationTools.requestCalculations(start,this.endDate);
  }

  private async handleUpdate() {
    let results = await this.requestCalculations();
    this.onresultscalculated.invoke(results);
  }
}

const instance = { instance: new CalculationsManager() }
export { instance as CalculationsManager }