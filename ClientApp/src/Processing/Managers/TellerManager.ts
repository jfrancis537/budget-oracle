import { DataAPI } from "../../APIs/DataAPI";
import { BalanceData, LinkedAccountDetails, TellerAPI, TransactionData } from "../../APIs/TellerAPI";
import { TellerSetupArgs } from "../../Types/Teller";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { AuthorizationError } from "../../Utilities/Errors/AuthorizationError";
import { download } from "../../Utilities/FileUtils";
import { LinkedAccountCalculation } from "./CalculationsManager";
import { UserManager } from "./UserManager";

const applicationId = "app_o20o86tki9q1nfvons000";

export const IGNORED_TRANSACTION_CATEGORY = 'Ignored';

interface ISerializedCategoryData {
  categories: string[]
  categorizedTransactions: [string, string][];
}

class TellerManager {

  public onlinkedbalanceupdated: Action<BalanceData>;
  public onlinkedtransactionsupdated: Action<TransactionData[]>;
  public onlinkedaccountsupdated: Action<LinkedAccountDetails[]>;
  public oncategorynamesupdated: Action<Set<string>>;
  public ontransactioncategorized: Action<string>; // Sends the id of the transaction
  private accounts: Map<string, LinkedAccountDetails>;
  private balances: Map<string, BalanceData>;
  private transactions: Map<string, TransactionData[]>;
  /** Maps the transaction id to the category */
  private categorizedTransactions: Map<string, string>;
  private categories: Set<string>;

  constructor() {
    this.onlinkedbalanceupdated = new Action();
    this.onlinkedaccountsupdated = new Action();
    this.onlinkedtransactionsupdated = new Action();
    this.oncategorynamesupdated = new Action();
    this.ontransactioncategorized = new Action();
    this.categorizedTransactions = new Map();
    this.accounts = new Map();
    this.balances = new Map();
    this.transactions = new Map();
    this.categories = new Set();
    UserManager.onuserloggedin.addListener(this.onLogin);
    UserManager.onuserloggedout.addListener(this.clear);
  }

  public async categorizeTransaction(id: string, category: string | null) {
    if (category) {
      this.categorizedTransactions.set(id, category);
      this.ontransactioncategorized.invoke(id);
    } else {
      this.categorizedTransactions.delete(id);
      this.ontransactioncategorized.invoke(id);
    }
    await this.save();
  }

  public getTransactionCategory(id: string): string | undefined {
    return this.categorizedTransactions.get(id);
  }

  public async addTransactionCategory(name: string) {
    let result = false;
    if (!this.categories.has(name)) {
      this.categories.add(name);
      this.oncategorynamesupdated.invoke(this.categories);
    }
    await this.save();
    return result;
  }

  public hasTransactionCategory(name: string) {
    return this.categories.has(name) || this.categories.has(name.toLowerCase());
  }

  public get categoryNames() {
    const sorted =  [...this.categories];
    sorted.sort();
    return sorted;
  }

  public get categoryNamesNotIgnored() {
    const sorted =  [...this.categories].filter(c => c !== IGNORED_TRANSACTION_CATEGORY);
    sorted.sort();
    return sorted;
  }

  public getTransactions() {
    return [...this.transactions.values()].flat();
  }

  public async linkNewAccounts(): Promise<LinkedAccountDetails[]> {
    const userId = await TellerAPI.getUserId();
    return new Promise((resolve, reject) => {

      const options: TellerSetupArgs = {
        environment: "development",
        applicationId: applicationId,
        onSuccess: async (e) => {
          const linked = (await TellerAPI.getLinkedAccountDetailsForEnrollment(e)).filter(acc => acc.enrollmentId === e.enrollment.id && !this.accounts.has(acc.id));
          if (!userId) {
            await TellerAPI.setTellerUserId(e.user.id);
          }
          resolve(linked);
        },
        onExit: () => {
          reject(true)
        },
        onFailure: () => {
          reject(false);
        }
      };
      if (userId) {
        options.userId = userId;
      }
      TellerConnect.setup(options).open();
    });
  }

  public async reauthExisting(enrollmentId: string): Promise<boolean> {
    const userId = await TellerAPI.getUserId();
    if(!userId)
    {
      return Promise.resolve(false);
    }
    return new Promise((resolve,reject) => {
      const options: TellerSetupArgs = {
        environment: 'development',
        applicationId: applicationId,
        enrollmentId: enrollmentId,
        onSuccess: () => {
          resolve(true);
        },
        onExit: () => {
          reject(false);
        },
        onFailure: () => {
          reject(false);
        }
      }
    });

  }

  public getAccount(id: string) {
    return this.accounts.get(id);
  }

  public async saveLinkedAccounts(linked: LinkedAccountDetails[]) {
    await TellerAPI.addLinkedAccounts(linked);
    for (let account of linked) {
      this.accounts.set(account.id, account);
    }
    this.onlinkedaccountsupdated.invoke([...this.accounts.values()]);
    for (let account of linked) {
      this.loadAccountData(account.id);
    }
  }

  public delete(id: string) {
    this.balances.delete(id);
    this.accounts.delete(id);
    this.onlinkedaccountsupdated.invoke([...this.accounts.values()]);
    TellerAPI.deleteAccount(id);
  }

  @autobind
  public clear() {
    this.accounts.clear();
    this.balances.clear();
    this.transactions.clear();
    this.categorizedTransactions.clear();
    this.categories.clear();
    this.onlinkedaccountsupdated.invoke([]);
    this.onlinkedtransactionsupdated.invoke([]);
  }

  public exportReport(data: TransactionData[])
  {
    let report = data.map(t => {
      const category = this.getTransactionCategory(t.id);
      return [t.description,`$${t.amount}`,category ?? 'uncategorized'].join(';');
    }).join("\n");
    report = `sep=;\n${report}`;
    download(`spending_report_${(new Date()).toLocaleString().replace(", ", "-")}.csv`,report);
  }

  public getCurrentAccountBalance(id: string) {
    return this.balances.get(id);
  }

  @autobind
  public async getSavedAccounts() {
    const accounts = await TellerAPI.getAllLinkedAccounts();
    for (let account of accounts) {
      this.accounts.set(account.id, account);
    }
    this.onlinkedaccountsupdated.invoke([...this.accounts.values()]);
    for (let account of accounts) {
      this.loadAccountData(account.id);
    }
  }

  public refreshAccount(id: string) {
    this.loadAccountData(id);
  }

  @autobind
  private async onLogin() {
    await this.getSavedAccounts();
    await this.load();
  }

  @autobind
  private handleError(err: Error) {
    console.warn(err);
  }

  private loadAccountData(id: string) {
    TellerAPI.getAccountBalance(id).then(balance => {
      this.balances.set(id, balance);
      this.onlinkedbalanceupdated.invoke(balance);
    }).catch(this.handleError);

    TellerAPI.getAccountTransactions(id).then(transactions => {
      this.transactions.set(id, transactions);
      this.onlinkedtransactionsupdated.invoke(transactions);
    }).catch(this.handleError);
    // const [balance, transactions] = await Promise.all([TellerAPI.getAccountBalance(id), TellerAPI.getAccountTransactions(id)]);
    // this.onlinkedbalanceupdated.invoke(balance);
    // this.onlinkedtransactionsupdated.invoke(transactions);
    // this.balances.set(id, balance);
    // this.transactions.set(id, transactions);
  }

  public getTotalValueOfAccounts() {
    let result: LinkedAccountCalculation = {
      debt: 0,
      accountsValue: 0
    };
    for (let account of this.accounts.values()) {
      if (this.balances.has(account.id)) {
        if (account.type === "credit") {
          result.debt += this.balances.get(account.id)?.current!;
          if (this.transactions.has(account.id)) {
            const pendingTotal = this.transactions.get(account.id)!.reduce((prev, next) => {
              if (next.status === "pending" && (next.type === "transaction" || next.type === "atm")) {
                return prev + next.amount;
              }
              return prev;
            }, 0);
            result.debt += pendingTotal;
          }
        } else {
          //Use available for bank accounts
          result.accountsValue += this.balances.get(account.id)?.current!;
        }
      }
    }
    return result;
  }

  private async save() {
    const result = [...this.categorizedTransactions.entries()];
    const data: ISerializedCategoryData = {
      categories: [...this.categories],
      categorizedTransactions: result.map(mapper)
    }

    let serialized = JSON.stringify(data);
    if (UserManager.isLoggedIn) {
      try {
        await DataAPI.updateCategoryData(serialized);
      } catch (err) {
        if (err instanceof AuthorizationError) {
          await UserManager.logout();
        }
      }

    }
  }

  private async load() {
    let state: string | null;
    if (UserManager.isLoggedIn) {
      try {
        state = await DataAPI.getCategoryData();
      } catch {
        state = null;
      }
    } else {
      state = null;
    }
    if (state) {
      const data: ISerializedCategoryData = JSON.parse(state);
      this.categories = new Set(data.categories);
      if (!this.categories.has(IGNORED_TRANSACTION_CATEGORY)) {
        this.categories.add(IGNORED_TRANSACTION_CATEGORY);
      }
      this.oncategorynamesupdated.invoke(this.categories);
      for (const [id, category] of data.categorizedTransactions) {
        this.categorizedTransactions.set(id, category);
        this.ontransactioncategorized.invoke(id);
      }
    }
  }

}

function mapper(kvp: [string, string]): [string, string] {
  return [kvp[0], kvp[1]];
}

const instance = new TellerManager();

export { instance as TellerManager }