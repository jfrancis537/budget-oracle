import { DataAPI } from "../../APIs/DataAPI";
import { Action } from "../../Utilities/Action";
import { AppStateManager } from "./AppStateManager";
import { LoginManager } from "./LoginManager";

export const GroupStateKey = 'group_state_data'

type GroupState = {
  billGroups: [string, string[]][];
  debtGroups: [string, string[]][];
}

export enum GroupType {
  Bill,
  Debt
}

export interface GroupsData {
  billGroups: Map<string, Set<string>>;
  debtGroups: Map<string, Set<string>>;
}

class GroupManager {

  private billGroups: Map<string, Set<string>>;
  private debtGroups: Map<string, Set<string>>;
  public ongroupsupdated: Action<GroupsData>;

  constructor() {
    this.billGroups = new Map();
    this.debtGroups = new Map();
    this.ongroupsupdated = new Action();

    this.reload = this.reload.bind(this);
    LoginManager.onuserloggedin.addListener(this.reload);
    LoginManager.onuserloggedout.addListener(this.reload);
    this.load();
  }

  get groups() {
    return {
      billGroups: this.billGroups,
      debtGroups: this.debtGroups
    };
  }

  public hasGroup(type: GroupType, name: string) {
    if (type === GroupType.Bill) {
      return this.billGroups.has(name);
    } else {
      return this.debtGroups.has(name);
    }
  }

  public getGroup(type: GroupType, name: string) {
    return type === GroupType.Bill ? this.billGroups.get(name) : this.debtGroups.get(name);
  }

  public addGroup(name: string, type: GroupType) {
    if (this.hasGroup(type, name)) {
      throw new Error(`Group with name: ${name} already exists.`);
    } else if (type === GroupType.Bill) {
      this.billGroups.set(name, new Set());
    } else {
      this.debtGroups.set(name, new Set());
    }
    this.ongroupsupdated.invoke(this.groups);
    this.save();
  }

  public updateGroup(type: GroupType, oldName: string, newName: string) {
    if (this.hasGroup(type, newName)) {
      throw new Error(`Group with name: ${newName} already exists.`);
    } else if (!this.hasGroup(type, oldName)) {
      throw new Error(`Group with name: ${oldName} doesn't exist, and therfore can not be updated`);
    } else if (type === GroupType.Bill) {
      let set = this.billGroups.get(oldName)!;
      this.billGroups.set(newName, set);
      this.billGroups.delete(oldName);
    } else {
      let set = this.debtGroups.get(oldName)!;
      this.debtGroups.set(newName, set);
      this.debtGroups.delete(oldName);
    }
    this.ongroupsupdated.invoke(this.groups);
    this.save();
  }

  public deleteGroup(name: string, type: GroupType) {
    let group = this.getGroup(type, name);
    if (group) {
      AppStateManager.deleteItems(group);
    }
    let map = type === GroupType.Bill ? this.billGroups : this.debtGroups;
    map.delete(name);
    this.ongroupsupdated.invoke(this.groups);
    this.save();
  }

  public deleteItem(itemId: string, type: GroupType) {
    let groups = type === GroupType.Bill ? this.billGroups : this.debtGroups;
    for (let [, set] of groups) {
      if (set.delete(itemId)) {
        break;
      }
    }
    this.save();
  }

  public deleteItemFromGroup(itemId: string, type: GroupType, name: string) {
    let set = this.getGroup(type, name);
    set?.delete(itemId);
    this.save();
  }

  public addItemToGroup(id: string, type: GroupType, name: string) {
    let set = this.getGroup(type, name);
    if (set) {
      set.add(id);
    } else {
      throw new Error('Can not add item to non-existant group');
    }
    this.save();
  }

  public reset() {
    //clear localStorage
    localStorage.removeItem(GroupStateKey);
    //clear group things
    this.billGroups.clear();
    this.debtGroups.clear();
    //update UI
    this.ongroupsupdated.invoke(this.groups);
  }

  private groupMapToArray(map: Map<string, Set<string>>): [string, string[]][] {
    const result = [...map.entries()];
    return result.map(mapper);
  }

  private save() {
    const data: GroupState = {
      billGroups: this.groupMapToArray(this.billGroups),
      debtGroups: this.groupMapToArray(this.debtGroups)
    };
    let serialized = JSON.stringify(data);
    serialized = btoa(serialized);
    if (LoginManager.isLoggedIn) {
      DataAPI.updateGroups(serialized);
    } else {
      localStorage.setItem(GroupStateKey, serialized);
    }

  }

  private async load() {
    let groupState: string | null;
    if (LoginManager.isLoggedIn) {
      try {
        groupState = await DataAPI.getGroupData();
      } catch {
        groupState = null;
      }
    } else {
      groupState = localStorage.getItem(GroupStateKey);
    }
    if (groupState) {
      groupState = atob(groupState);
      const data: GroupState = JSON.parse(groupState);
      for (let [key, set] of data.billGroups) {
        let idSet = new Set(set);
        this.billGroups.set(key, idSet);
      }
      for (let [key, set] of data.debtGroups) {
        let idSet = new Set(set);
        this.debtGroups.set(key, idSet);
      }
    }
  }

  private reload() {
    //clear group things
    this.billGroups.clear();
    this.debtGroups.clear();
    //Reload
    this.load();
    //update UI
    this.ongroupsupdated.invoke(this.groups);
  }

  public export() {
    return localStorage.getItem(GroupStateKey);
  }

  public import(groups: string) {
    localStorage.setItem(GroupStateKey, groups);
    this.reload();
  }



}

function mapper(kvp: [string, Set<string>]): [string, string[]] {
  return [kvp[0], [...kvp[1]]];
}

let instance = new GroupManager();
export { instance as GroupManager }