import { DataAPI } from "../../APIs/DataAPI";
import { Action } from "../../Utilities/Action";
import { AuthorizationError } from "../../Utilities/Errors/AuthorizationError";
import { AppStateManager } from "./AppStateManager";
import { UserManager } from "./UserManager";

interface InvestmentGroupState {
  groups: [string, string[]][];
}

export type InvestmentGroupData = Map<string, Set<string>>;

class InvestmentGroupManger {

  public readonly groups: Map<string, Set<string>>;
  public readonly ongroupsupdated: Action<Map<string, Set<string>>>;

  constructor() {
    this.groups = new Map();
    this.ongroupsupdated = new Action();
    this.reload = this.reload.bind(this);
    UserManager.onuserloggedin.addListener(this.reload);
    UserManager.onuserloggedout.addListener(this.reload);
  }

  //GROUP MANAGEMENT

  public hasGroup(name: string) {
    return this.groups.has(name);
  }

  public getGroup(name: string) {
    return this.groups.get(name);
  }

  public async addGroup(name: string) {
    if (this.hasGroup(name)) {
      throw new Error(`Group with name: ${name} already exists.`);
    } else {
      this.groups.set(name, new Set());
    }
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async updateGroup(oldName: string, newName: string) {
    if (this.hasGroup(newName)) {
      throw new Error(`Group with name: ${newName} already exists.`);
    } else if (!this.hasGroup(oldName)) {
      throw new Error(`Group with name: ${oldName} doesn't exist, and therfore can not be updated`);
    } else {
      let set = this.groups.get(oldName)!;
      this.groups.set(newName, set);
      this.groups.delete(oldName);
    }
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async deleteGroup(name: string) {
    let group = this.getGroup(name);
    if (group) {
      await AppStateManager.deleteItems(group);
    }
    this.groups.delete(name);
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async deleteItem(itemId: string) {
    for (let [, set] of this.groups) {
      if (set.delete(itemId)) {
        break;
      }
    }
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async deleteItemFromGroup(itemId: string, name: string) {
    let set = this.getGroup(name);
    set?.delete(itemId);
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async clearGroup(name: string) {
    let set = this.getGroup(name);
    if (set) {
      await AppStateManager.deleteItems(set);
      set?.clear();
    }
    this.ongroupsupdated.invoke(this.groups);
    await this.save();
  }

  public async addItemToGroup(id: string, name: string) {
    let set = this.getGroup(name);
    if (set) {
      set.add(id);
      this.ongroupsupdated.invoke(this.groups);
    } else {
      throw new Error('Can not add item to non-existant group');
    }
    await this.save();
  }

  public async reset() {
    //clear group things
    this.groups.clear();
    //update UI
    this.ongroupsupdated.invoke(this.groups);
    //Save
    await this.save();
  }

  private groupMapToArray(map: Map<string, Set<string>>): [string, string[]][] {
    const result = [...map.entries()];
    return result.map(mapper);
  }

  private async save() {
    const data: InvestmentGroupState = {
      groups: this.groupMapToArray(this.groups)
    };
    let serialized = JSON.stringify(data);
    if (UserManager.isLoggedIn) {
      try {
        await DataAPI.updateInvestmentGroups(serialized);
      } catch (err) {
        if (err instanceof AuthorizationError) {
          await UserManager.logout();
        }
      }

    }
  }

  private async load() {
    let groupState: string | null;
    if (UserManager.isLoggedIn) {
      try {
        groupState = await DataAPI.getInvestmentGroupData();
      } catch {
        groupState = null;
      }
    } else {
      groupState = null;
    }
    if (groupState) {
      const data: InvestmentGroupState = JSON.parse(groupState);
      for (let [key, set] of data.groups) {
        let idSet = new Set(set);
        this.groups.set(key, idSet);
      }
    }
  }


  private async reload() {
    //clear group things
    this.groups.clear();
    //Reload
    await this.load();
    //update UI
    this.ongroupsupdated.invoke(this.groups);
  }

  public async export() {
    if (UserManager.isLoggedIn) {
      return await DataAPI.getInvestmentGroupData();
    }
  }

  public async import(groups: string) {
    if (UserManager.isLoggedIn) {
      try {
        await DataAPI.updateInvestmentGroups(groups);
      } catch (err) {
        if (err instanceof AuthorizationError) {
          await UserManager.logout();
        }
      }

    }
    await this.reload();
  }

}

function mapper(kvp: [string, Set<string>]): [string, string[]] {
  return [kvp[0], [...kvp[1]]];
}

const instance = new InvestmentGroupManger();
export { instance as InvestmentGroupManager };