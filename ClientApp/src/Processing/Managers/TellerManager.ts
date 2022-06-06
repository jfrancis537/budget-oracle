import { BalanceData, LinkedAccountDetails, TellerAPI, TransactionData } from "../../APIs/TellerAPI";
import { TellerSetupArgs } from "../../Types/Teller";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { LinkedAccountCalculation } from "./CalculationsManager";
import { UserManager } from "./UserManager";

const applicationId = "app_o20o86tki9q1nfvons000";

class TellerManager {

  public onlinkedbalanceupdated: Action<BalanceData>;
  public onlinkedtransactionsupdated: Action<TransactionData[]>;
  public onlinkedaccountsupdated: Action<LinkedAccountDetails[]>;
  private accounts: Map<string, LinkedAccountDetails>;
  private balances: Map<string, BalanceData>;
  private transactions: Map<string, TransactionData[]>;

  constructor() {
    this.onlinkedbalanceupdated = new Action();
    this.onlinkedaccountsupdated = new Action();
    this.onlinkedtransactionsupdated = new Action();
    this.accounts = new Map();
    this.balances = new Map();
    this.transactions = new Map();
    UserManager.onuserloggedin.addListener(this.getSavedAccounts);
    UserManager.onuserloggedout.addListener(this.clear);
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
  }

  @autobind
  public clear() {
    this.accounts.clear();
    this.balances.clear();
    this.onlinkedaccountsupdated.invoke([]);
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
  private handleError(err: Error) {
    console.warn(err);
  }

  private loadAccountData(id: string) {
    TellerAPI.getAccountBalance(id).then(balance => {
      this.onlinkedbalanceupdated.invoke(balance);
      this.balances.set(id, balance);
    }).catch(this.handleError);

    TellerAPI.getAccountTransactions(id).then(transactions => {
      this.onlinkedtransactionsupdated.invoke(transactions);
      this.transactions.set(id, transactions);
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
        } else {
          //Use available for bank accounts
          result.accountsValue += this.balances.get(account.id)?.available!;
        }
      }
    }
    return result;
  }

}

const instance = new TellerManager();

export { instance as TellerManager }