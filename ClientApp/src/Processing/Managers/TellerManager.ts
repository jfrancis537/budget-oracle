import { BalanceData, LinkedAccountDetails, TellerAPI } from "../../APIs/TellerAPI";
import { TellerSetupArgs } from "../../Types/Teller";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { LinkedAccountCalculation } from "./CalculationsManager";
import { UserManager } from "./UserManager";

const applicationId = "app_o20o86tki9q1nfvons000";

class TellerManager {

  public onlinkedbalanceupdated: Action<BalanceData>;
  public onlinkedaccountsupdated: Action<LinkedAccountDetails[]>;
  private accounts: Map<string, LinkedAccountDetails>;
  private balances: Map<string, BalanceData>;

  constructor() {
    this.onlinkedbalanceupdated = new Action();
    this.onlinkedaccountsupdated = new Action();
    this.accounts = new Map();
    this.balances = new Map();
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
      this.loadAccountBalance(account.id);
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
      this.loadAccountBalance(account.id);
    }
  }

  public async refreshAccount(id: string) {
    await this.loadAccountBalance(id);
  }

  private async loadAccountBalance(id: string) {
    const balance = await TellerAPI.getAccountBalance(id);
    this.onlinkedbalanceupdated.invoke(balance);
    this.balances.set(id, balance);
    return balance;
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