import { Moment } from "moment";
import { DataAPI } from "../../APIs/DataAPI";
import { Action } from "../../Utilities/Action";
import { AuthorizationError } from "../../Utilities/Errors/AuthorizationError";
import { FrequencyType } from "../Enums/FrequencyType";
import { GroupType } from "../Enums/GroupType";
import { IncomeFrequency } from "../Enums/IncomeFrequency";
import { Account, SerializedAccount } from "../Models/Account";
import { Bill, SerializedBill } from "../Models/Bill";
import { Debt, SerializedDebt } from "../Models/Debt";
import { IncomeSource, SerializedIncomeSource } from "../Models/IncomeSource";
import { Investment, InvestmentOptions, SerializedInvestment } from "../Models/Investment";
import { PaymentSchedule, SerializedPaymentSchedule } from "../Models/ScheduledPayment";
import { SerializedVestSchedule, VestSchedule } from "../Models/VestSchedule";
import { GroupManager } from "./GroupManager";
import { UserManager } from "./UserManager";

interface StateData {
  accounts: SerializedAccount[];
  debts: SerializedDebt[];
  bills: SerializedBill[];
  income: SerializedIncomeSource[];
  investments: SerializedInvestment[];
  paymentSchedules: SerializedPaymentSchedule[];
  vestSchedules: SerializedVestSchedule[];
}

const StateDataKey = "app_state_data";

class AppStateManager {

  private _accounts: Map<string, Account>;
  private _debts: Map<string, Debt>;
  private _bills: Map<string, Bill>;
  private _paymentSchedules: Map<string, PaymentSchedule>;
  private _incomeSources: Map<string, IncomeSource>;
  private _investments: Map<string, Investment>;
  private _vestSchedules: Map<string, VestSchedule>;
  private blockSave: boolean;

  public onaccountsupdated: Action<Account[]>;
  public onincomesourcesupdated: Action<IncomeSource[]>;
  public ondebtsupdated: Action<Debt[]>;
  public onbillsupdated: Action<Bill[]>;
  public oninvestmentsupdated: Action<Investment[]>;
  public onspecificinvestmentupdated: Action<Investment>;
  public onpaymentschedulesupdated: Action<PaymentSchedule[]>;
  public onvestschedulesupdated: Action<VestSchedule[]>;

  constructor() {
    this._accounts = new Map();
    this._debts = new Map();
    this._bills = new Map();
    this._incomeSources = new Map();
    this._investments = new Map();
    this._paymentSchedules = new Map();
    this._vestSchedules = new Map();
    this.blockSave = false;

    this.onaccountsupdated = new Action();
    this.onincomesourcesupdated = new Action();
    this.ondebtsupdated = new Action();
    this.onbillsupdated = new Action();
    this.oninvestmentsupdated = new Action();
    this.onspecificinvestmentupdated = new Action();
    this.onpaymentschedulesupdated = new Action();
    this.onvestschedulesupdated = new Action();

    this.reload = this.reload.bind(this);
    UserManager.onuserloggedout.addListener(this.reload)
    UserManager.onuserloggedin.addListener(this.reload);
    this.loadLocal();
  }

  get accounts() {
    return [...this._accounts.values()];
  }

  get incomeSources() {
    return [...this._incomeSources.values()];
  }

  get debts() {
    return [...this._debts.values()];
  }

  get bills() {
    return [...this._bills.values()];
  }

  get investments() {
    return [...this._investments.values()];
  }

  get paymentSchedules() {
    return [...this._paymentSchedules.values()];
  }

  get vestSchedules() {
    return [...this._vestSchedules.values()];
  }

  public async deleteItems(ids: Set<string>) {
    if (ids.size > 0) {
      //Block stuff
      this.blockSave = true;
      let incomeBlock = this.onincomesourcesupdated.setBlocked(true);
      let accountBlock = this.onaccountsupdated.setBlocked(true);
      let debtBlock = this.ondebtsupdated.setBlocked(true);
      let billBlock = this.onbillsupdated.setBlocked(true);
      let investmentBlock = this.oninvestmentsupdated.setBlocked(true);
      let pmntScheduleBlock = this.onpaymentschedulesupdated.setBlocked(true);
      let vestScheduleBlock = this.onvestschedulesupdated.setBlocked(true);
      for (let id of ids) {
        await this.deleteItem(id);
      }
      //unblock stuff
      this.onincomesourcesupdated.setBlocked(incomeBlock);
      this.onaccountsupdated.setBlocked(accountBlock);
      this.ondebtsupdated.setBlocked(debtBlock);
      this.onbillsupdated.setBlocked(billBlock);
      this.oninvestmentsupdated.setBlocked(investmentBlock);
      this.onpaymentschedulesupdated.setBlocked(pmntScheduleBlock);
      this.onvestschedulesupdated.setBlocked(vestScheduleBlock);
      this.blockSave = false;
      //send updates
      this.onincomesourcesupdated.invoke(this.incomeSources);
      this.onaccountsupdated.invoke(this.accounts);
      this.ondebtsupdated.invoke(this.debts);
      this.onbillsupdated.invoke(this.bills);
      this.oninvestmentsupdated.invoke(this.investments);
      this.onpaymentschedulesupdated.invoke(this.paymentSchedules);
      this.onvestschedulesupdated.invoke(this.vestSchedules);
      //save
      await this.save();
    }
  }

  public async deleteItem(id: string) {
    if (this._bills.has(id)) {
      await GroupManager.deleteItem(id, GroupType.Bill);
      this._bills.delete(id);
      this.onbillsupdated.invoke(this.bills);
      await this.save();
    } else if (this._debts.has(id)) {
      await GroupManager.deleteItem(id, GroupType.Debt);
      this._debts.delete(id);
      this.ondebtsupdated.invoke(this.debts);
      await this.save();
    } else if (this._accounts.has(id)) {
      this._accounts.delete(id);
      this.onaccountsupdated.invoke(this.accounts);
      await this.save();
    } else if (this._incomeSources.has(id)) {
      this._incomeSources.delete(id);
      this.onincomesourcesupdated.invoke(this.incomeSources);
      await this.save();
    } else if (this._investments.has(id)) {
      this._investments.delete(id);
      this.oninvestmentsupdated.invoke(this.investments);
      await this.save();
    } else if (this._paymentSchedules.has(id)) {
      this._paymentSchedules.delete(id);
      this.onpaymentschedulesupdated.invoke(this.paymentSchedules);
      await this.save();
    } else if (this._vestSchedules.has(id)) {
      this._vestSchedules.delete(id);
      this.onvestschedulesupdated.invoke(this.vestSchedules);
      await this.save();
    }
  }

  public async addAccount(name: string, amount: number, liquid: boolean) {
    await this.updateAccount(undefined, name, amount, liquid);
  }
  public async updateAccount(id: string | undefined, name: string, amount: number, liquid: boolean) {
    const account = new Account({
      name,
      amount,
      liquid,
      id
    });
    this._accounts.set(account.id, account);
    this.onaccountsupdated.invoke(this.accounts);
    await this.save();
  }
  public hasAccount(id: string) {
    return this._accounts.has(id);
  }
  public getAccount(id: string) {
    return this._accounts.get(id);
  }

  public hasDebt(id: string) {
    return this._debts.has(id);
  }
  public getDebt(id: string) {
    return this._debts.get(id);
  }
  public async updateDebt(id: string | undefined, name: string, amount: number) {
    const debt = new Debt({
      name: name,
      amount: amount,
      id: id
    });
    this._debts.set(debt.id, debt);
    this.ondebtsupdated.invoke(this.debts);
    await this.save();
    return debt.id;
  }

  public async addDebt(name: string, value: number) {
    return await this.updateDebt(undefined, name, value);
  }

  public hasBill(id: string) {
    return this._bills.has(id);
  }
  public getBill(id: string) {
    return this._bills.get(id);
  }
  public async updateBill(
    id: string | undefined,
    name: string,
    amount: number,
    frequency: number,
    frequencyType: FrequencyType,
    initialDate: Moment,
    endDate: Moment | undefined,
    unavoidable: boolean
  ) {
    const bill = new Bill({
      name: name,
      amount: amount,
      frequencyType: frequencyType,
      frequency: frequency,
      initialDate: initialDate,
      endDate: endDate,
      id: id,
      unavoidable: unavoidable
    });
    this._bills.set(bill.id, bill);
    this.onbillsupdated.invoke(this.bills);
    await this.save();
    return bill.id;
  }
  public async addBill(
    name: string,
    amount: number,
    frequency: number,
    frequencyType: FrequencyType,
    initialDate: Moment,
    endDate: Moment | undefined,
    unavoidable: boolean
  ) {
    return await this.updateBill(undefined, name, amount, frequency, frequencyType, initialDate,endDate, unavoidable);
  }

  //Payment Schedules

  public hasPaymentSchedule(id: string) {
    return this._paymentSchedules.has(id);
  }

  public getPaymentSchedule(id: string) {
    return this._paymentSchedules.get(id);
  }

  public async addPaymentSchedule(schedule: PaymentSchedule) {
    this._paymentSchedules.set(schedule.id, schedule);
    this.onpaymentschedulesupdated.invoke(this.paymentSchedules);
    await this.save();
  }

  //VEST SCHEDULES

  public hasVestSchedule(id: string) {
    return this._vestSchedules.has(id);
  }

  public getVestSchedule(id: string) {
    return this._vestSchedules.get(id);
  }

  public async addVestSchedule(schedule: VestSchedule) {
    this._vestSchedules.set(schedule.id, schedule);
    this.onvestschedulesupdated.invoke(this.vestSchedules);
    await this.save();
  }

  //INCOME SOURCES

  public async addIncomeSource(name: string, amount: number, frequency: IncomeFrequency, paysOnWeekends: boolean, dayOfMonth: number, startDate: Moment) {
    await this.updateIncomeSource(undefined, name, amount, frequency, paysOnWeekends, dayOfMonth, startDate);
  }

  public async updateIncomeSource(id: string | undefined,
    name: string,
    amount: number,
    frequency: IncomeFrequency,
    paysOnWeekends: boolean,
    dayOfMonth: number,
    startDate: Moment) {
    const incomeSource = new IncomeSource({
      id: id,
      name: name,
      frequencyType: frequency,
      paysOnWeekends: paysOnWeekends,
      amount: amount,
      dayOfMonth: dayOfMonth,
      startDate: startDate
    });
    this._incomeSources.set(incomeSource.id, incomeSource);
    this.onincomesourcesupdated.invoke(this.incomeSources);
    await this.save();
  }
  public hasIncomeSource(id: string) {
    return this._incomeSources.has(id);
  }
  public getIncomeSource(id: string) {
    return this._incomeSources.get(id);
  }

  //INVESTMENTS

  public async addInvestment(
    name: string,
    shares: number,
    symbol: string,
    costBasisPerShare: number,
    marginDebt: number,
    marginInterestRate: number) {
    return await this.updateInvestment(undefined, name, shares, symbol, costBasisPerShare, marginDebt, marginInterestRate);
  }

  public async addInvestments(investments: InvestmentOptions[]) {
    const blocked = this.oninvestmentsupdated.setBlocked(true);
    const blocked2 = this.onspecificinvestmentupdated.setBlocked(true);
    this.blockSave = true;
    const ids = [];
    for (const investment of investments) {
      ids.push(
        await this.addInvestment(
          investment.name,
          investment.shares,
          investment.symbol,
          investment.costBasisPerShare,
          investment.marginDebt,
          investment.marginInterestRate
        ));
    }
    this.oninvestmentsupdated.setBlocked(blocked);
    this.onspecificinvestmentupdated.setBlocked(blocked2);
    this.blockSave = false;
    this.oninvestmentsupdated.invoke(this.investments);
    for (let id of ids) {
      this.onspecificinvestmentupdated.invoke(this._investments.get(id)!)
    }
    await this.save();
    return ids;
  }

  public async updateInvestment(id: string | undefined,
    name: string,
    shares: number,
    symbol: string,
    costBasisPerShare: number,
    marginDebt: number,
    marginInterestRate: number
  ) {
    const investment = new Investment({
      id,
      name,
      shares,
      symbol,
      costBasisPerShare,
      marginDebt,
      marginInterestRate
    });

    this._investments.set(investment.id, investment);
    this.oninvestmentsupdated.invoke(this.investments);
    this.onspecificinvestmentupdated.invoke(investment);
    await this.save();
    return investment.id;
  }
  public hasInvestment(id: string) {
    return this._investments.has(id);
  }
  public getInvestment(id: string) {
    return this._investments.get(id);
  }

  public async reset() {
    //clear the data
    this._accounts.clear();
    this._bills.clear();
    this._debts.clear();
    this._incomeSources.clear();
    this._investments.clear();
    //Update the UI
    this.onincomesourcesupdated.invoke(this.incomeSources);
    this.onaccountsupdated.invoke(this.accounts);
    this.ondebtsupdated.invoke(this.debts);
    this.onbillsupdated.invoke(this.bills);
    this.oninvestmentsupdated.invoke(this.investments);
    //Save
    await this.save();
  }

  private async save() {
    if (!this.blockSave) {
      let data = {
        accounts: [...this._accounts.values()],
        debts: [...this._debts.values()],
        bills: [...this._bills.values()],
        income: [...this._incomeSources.values()],
        investments: [...this._investments.values()],
        paymentSchedules: [...this._paymentSchedules.values()],
        vestSchedules: [...this._vestSchedules.values()]
      }
      let serialized = JSON.stringify(data);
      if (UserManager.isLoggedIn) {
        try {
          await DataAPI.updateState(serialized);
        } catch (err) {
          if (err instanceof AuthorizationError) {
            await UserManager.logout();
          }
        }

      } else {
        localStorage.setItem(StateDataKey, serialized);
      }
    }
  }

  private async load() {
    //load
    let data;
    if (UserManager.isLoggedIn) {
      try {
        data = await DataAPI.getStateData();
      } catch {
        data = null;
      }
    } else {
      data = localStorage.getItem(StateDataKey);
    }
    if (data) {
      let parsed: StateData = JSON.parse(data);
      for (let bill of parsed.bills ?? []) {
        this._bills.set(bill.id, Bill.deserialize(bill));
      }
      for (let account of parsed.accounts ?? []) {
        this._accounts.set(account.id, Account.deserialize(account));
      }
      for (let source of parsed.income ?? []) {
        this._incomeSources.set(source.id, IncomeSource.deserialize(source));
      }
      for (let debt of parsed.debts ?? []) {
        this._debts.set(debt.id, Debt.deserialize(debt));
      }
      for (let investment of parsed.investments ?? []) {
        this._investments.set(investment.id, Investment.deserialize(investment));
      }
      for (let schedule of parsed.paymentSchedules ?? []) {
        this._paymentSchedules.set(schedule.id, PaymentSchedule.deserialize(schedule));
      }
      for (let schedule of parsed.vestSchedules ?? []) {
        this._vestSchedules.set(schedule.id, VestSchedule.deserialize(schedule));
      }
    }
  }

  private loadLocal() {
    const data = localStorage.getItem(StateDataKey);
    if (data) {
      let parsed: StateData = JSON.parse(data);
      for (let bill of parsed.bills ?? []) {
        this._bills.set(bill.id, Bill.deserialize(bill));
      }
      for (let account of parsed.accounts ?? []) {
        this._accounts.set(account.id, Account.deserialize(account));
      }
      for (let source of parsed.income ?? []) {
        this._incomeSources.set(source.id, IncomeSource.deserialize(source));
      }
      for (let debt of parsed.debts ?? []) {
        this._debts.set(debt.id, Debt.deserialize(debt));
      }
      for (let investment of parsed.investments ?? []) {
        this._investments.set(investment.id, Investment.deserialize(investment));
      }
      for (let schedule of parsed.paymentSchedules ?? []) {
        this._paymentSchedules.set(schedule.id, PaymentSchedule.deserialize(schedule));
      }
      for (let schedule of parsed.vestSchedules ?? []) {
        this._vestSchedules.set(schedule.id, VestSchedule.deserialize(schedule));
      }
    }
  }



  public async reload() {
    //clear the data
    this._accounts.clear();
    this._bills.clear();
    this._debts.clear();
    this._incomeSources.clear();
    this._investments.clear();
    this._paymentSchedules.clear();
    this._vestSchedules.clear();
    //Load the new data
    await this.load();
    //Update the UI
    this.onincomesourcesupdated.invoke(this.incomeSources);
    this.onaccountsupdated.invoke(this.accounts);
    this.ondebtsupdated.invoke(this.debts);
    this.onbillsupdated.invoke(this.bills);
    this.oninvestmentsupdated.invoke(this.investments);
    this.onpaymentschedulesupdated.invoke(this.paymentSchedules);
    this.onvestschedulesupdated.invoke(this.vestSchedules);
  }

  public async export() {
    let data: string | null;
    if (UserManager.isLoggedIn) {
      data = await DataAPI.getStateData();
    } else {
      data = localStorage.getItem(StateDataKey);
    }
    return data;
  }

  public async import(data: string) {
    if (UserManager.isLoggedIn) {
      try {
        await DataAPI.updateState(data);
      } catch (err) {
        if (err instanceof AuthorizationError) {
          await UserManager.logout();
        }
      }
    } else {
      //Set storage
      localStorage.setItem(StateDataKey, data);
    }
    await this.reload();
  }
}

const instance = new AppStateManager();

export { instance as AppStateManager };