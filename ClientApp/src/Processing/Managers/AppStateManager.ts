import { Moment } from "moment";
import { DataAPI } from "../../APIs/DataAPI";
import { Action } from "../../Utilities/Action";
import { FrequencyType } from "../Enums/FrequencyType";
import { IncomeFrequency } from "../Enums/IncomeFrequency";
import { Account, SerializedAccount } from "../Models/Account";
import { Bill, SerializedBill } from "../Models/Bill";
import { Debt, SerializedDebt } from "../Models/Debt";
import { IncomeSource, SerializedIncomeSource } from "../Models/IncomeSource";
import { GroupManager, GroupType } from "./GroupManager";
import { UserManager } from "./UserManager";

interface StateData {
  accounts: SerializedAccount[];
  debts: SerializedDebt[];
  bills: SerializedBill[];
  income: SerializedIncomeSource[];
}

const StateDataKey = "app_state_data";

class AppStateManager {

  private _accounts: Map<string, Account>;
  private _debts: Map<string, Debt>;
  private _bills: Map<string, Bill>;
  private _incomeSources: Map<string, IncomeSource>;
  private blockSave: boolean;

  public onaccountsupdated: Action<Iterable<Account>>;
  public onincomesourcesupdated: Action<Iterable<IncomeSource>>;
  public ondebtsupdated: Action<Iterable<Debt>>;
  public onbillsupdated: Action<Iterable<Bill>>;

  constructor() {
    this._accounts = new Map();
    this._debts = new Map();
    this._bills = new Map();
    this._incomeSources = new Map();
    this.blockSave = false;

    this.onaccountsupdated = new Action();
    this.onincomesourcesupdated = new Action();
    this.ondebtsupdated = new Action();
    this.onbillsupdated = new Action();

    this.reload = this.reload.bind(this);
    UserManager.onuserloggedout.addListener(this.reload)
    UserManager.onuserloggedin.addListener(this.reload);
    this.loadLocal();
  }

  public async init() {
    await this.load();
  }

  get accounts() {
    return this._accounts.values();
  }

  get incomeSources() {
    return this._incomeSources.values();
  }

  get debts() {
    return this._debts.values();
  }

  get bills() {
    return this._bills.values();
  }

  public async deleteItems(ids: Set<string>) {
    if (ids.size > 0) {
      //Block stuff
      this.blockSave = true;
      let incomeBlock = this.onincomesourcesupdated.setBlocked(true);
      let accountBlock = this.onaccountsupdated.setBlocked(true);
      let debtBlock = this.ondebtsupdated.setBlocked(true);
      let billBlock = this.onbillsupdated.setBlocked(true);
      for (let id of ids) {
        await this.deleteItem(id);
      }
      //unblock stuff
      this.onincomesourcesupdated.setBlocked(incomeBlock);
      this.onaccountsupdated.setBlocked(accountBlock);
      this.ondebtsupdated.setBlocked(debtBlock);
      this.onbillsupdated.setBlocked(billBlock);
      this.blockSave = false;
      //send updates
      this.onincomesourcesupdated.invoke(this.incomeSources);
      this.onaccountsupdated.invoke(this.accounts);
      this.ondebtsupdated.invoke(this.debts);
      this.onbillsupdated.invoke(this.bills);
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
    }
  }

  public async addAccount(name: string, amount: number) {
    await this.updateAccount(undefined, name, amount);
  }
  public async updateAccount(id: string | undefined, name: string, amount: number) {
    const account = new Account({
      name: name,
      amount: amount,
      id: id
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
    initialDate: Moment
  ) {
    const bill = new Bill({
      name: name,
      amount: amount,
      frequencyType: frequencyType,
      frequency: frequency,
      initialDate: initialDate,
      id: id
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
    initialDate: Moment
  ) {
    return await this.updateBill(undefined, name, amount, frequency, frequencyType, initialDate);
  }

  public async addIncomeSource(name: string, amount: number, frequency: IncomeFrequency, paysOnWeekends: boolean, dayOfMonth: number) {
    await this.updateIncomeSource(undefined, name, amount, frequency, paysOnWeekends, dayOfMonth);
  }

  public async updateIncomeSource(id: string | undefined,
    name: string,
    amount: number,
    frequency: IncomeFrequency,
    paysOnWeekends: boolean,
    dayOfMonth: number) {
    const incomeSource = new IncomeSource({
      id: id,
      name: name,
      frequencyType: frequency,
      paysOnWeekends: paysOnWeekends,
      amount: amount,
      dayOfMonth: dayOfMonth
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

  public async reset() {
    //clear the data
    this._accounts.clear();
    this._bills.clear();
    this._debts.clear();
    this._incomeSources.clear();
    //Update the UI
    this.onincomesourcesupdated.invoke(this.incomeSources);
    this.onaccountsupdated.invoke(this.accounts);
    this.ondebtsupdated.invoke(this.debts);
    this.onbillsupdated.invoke(this.bills);
    //Save
    await this.save();
  }

  private async save() {
    if (!this.blockSave) {
      let data = {
        accounts: [...this._accounts.values()],
        debts: [...this._debts.values()],
        bills: [...this._bills.values()],
        income: [...this._incomeSources.values()]
      }
      let serialized = JSON.stringify(data);
      if (UserManager.isLoggedIn) {
        await DataAPI.updateState(serialized);
      } else {
        localStorage.setItem(StateDataKey, serialized);
      }
    }
  }

  private async load() {
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
      for (let bill of parsed.bills) {
        this._bills.set(bill.id, Bill.deserialize(bill));
      }
      for (let account of parsed.accounts) {
        this._accounts.set(account.id, Account.deserialize(account));
      }
      for (let source of parsed.income) {
        this._incomeSources.set(source.id, IncomeSource.deserialize(source));
      }
      for (let debt of parsed.debts) {
        this._debts.set(debt.id, Debt.deserialize(debt));
      }
    }
  }

  private loadLocal() {
    const data = localStorage.getItem(StateDataKey);
    if (data) {
      let parsed: StateData = JSON.parse(data);
      for (let bill of parsed.bills) {
        this._bills.set(bill.id, Bill.deserialize(bill));
      }
      for (let account of parsed.accounts) {
        this._accounts.set(account.id, Account.deserialize(account));
      }
      for (let source of parsed.income) {
        this._incomeSources.set(source.id, IncomeSource.deserialize(source));
      }
      for (let debt of parsed.debts) {
        this._debts.set(debt.id, Debt.deserialize(debt));
      }
    }
  }

  public async reload() {
    //clear the data
    this._accounts.clear();
    this._bills.clear();
    this._debts.clear();
    this._incomeSources.clear();
    //Load the new data
    await this.load();
    //Update the UI
    this.onincomesourcesupdated.invoke(this.incomeSources);
    this.onaccountsupdated.invoke(this.accounts);
    this.ondebtsupdated.invoke(this.debts);
    this.onbillsupdated.invoke(this.bills);
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
      await DataAPI.updateState(data);
    } else {
      //Set storage
      localStorage.setItem(StateDataKey, data);
    }
    await this.reload();
  }
}

let instance = new AppStateManager();

export { instance as AppStateManager };