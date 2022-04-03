import { PlaidAPI, PlaidBalanceAccount } from "../../APIs/PlaidAPI";
import { Action } from "../../Utilities/Action";
import { autobind } from "../../Utilities/Decorators";
import { UserManager } from "./UserManager";

class PlaidManager {
  public readonly onitemsupdated: Action<Iterable<string>>
  private readonly items: Set<string>;
  private readonly itemData: Map<string, PlaidBalanceAccount[]>;
  constructor() {
    this.items = new Set();
    this.itemData = new Map();
    this.onitemsupdated = new Action();
    UserManager.onuserloggedin.addListener(this.init);
  }

  @autobind
  public async init() {
    const items = await PlaidAPI.getAllItems();
    if (items) {
      var blockState = this.onitemsupdated.setBlocked(true);
      for (let item of items) {
        this.addItem(item);
      }
      this.onitemsupdated.setBlocked(blockState);
      this.onitemsupdated.invoke(this.items);
    } else {
      //TODO handle error for item retrevial
    }
  }

  public addItem(id: string) {
    if (this.items.add(id)) {
      this.onitemsupdated.invoke(this.items);
    }
  }

  public removeItem(id: string) {
    if (this.items.delete(id)) {
      this.onitemsupdated.invoke(this.items);
    }
  }

  public async getBalancesForItem(id: string, forceRefresh = false) {
    if (!forceRefresh && this.itemData.has(id)) {
      return this.itemData.get(id)!;
    } else {
      var balanceData = await PlaidAPI.getBalances(id);
      if (balanceData) {
        this.itemData.set(id, balanceData);
        return balanceData;
      } else {
        return undefined;
      }
    }
  }
}

const instance = new PlaidManager();
export { instance as PlaidManager };