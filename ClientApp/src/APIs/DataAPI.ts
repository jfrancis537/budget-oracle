import { AuthorizationError } from "../Utilities/Errors/AuthorizationError";

export interface BudgetData {
  stateData: string,
  groupData: string,
  investmentGroupData: string
}

export namespace DataAPI {
  const baseUrl = "/api/data";
  export async function getStateData(): Promise<BudgetData["stateData"]> {
    let url = `${baseUrl}/getState`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error("Failed to get data.");
    }
  }

  export async function getGroupData(): Promise<BudgetData["groupData"]> {
    let url = `${baseUrl}/getGroups`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error("Failed to get data.");
    }
  }

  export async function getInvestmentGroupData(): Promise<BudgetData["investmentGroupData"]> {
    let url = `${baseUrl}/getInvestmentGroups`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.text();
    } else {
      throw new Error("Failed to get data.");
    }
  }

  export async function updateState(state: string) {
    let url = `${baseUrl}/updateState`;
    let body = { state: state };
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.status === 400) {
      //Some weird error
    } else if (response.status === 401) {
      throw new AuthorizationError("You are probably not logged in anymore");
    }
    else if (!response.ok) {
      throw new Error("Failed to update data!");
    }
  }

  /**
   * Regular groups are now cost groups
   * @param groups 
   */
  export async function updateGroups(groups: string) {
    let url = `${baseUrl}/updateGroups`;
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ groups: groups }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.status === 400) {
      //Some weird error
    } else if (response.status === 401) {
      throw new AuthorizationError("You are probably not logged in anymore");
    }
    else if (!response.ok) {
      throw new Error("Failed to update data!");
    }
  }

  export async function updateInvestmentGroups(groups: string)
  {
    let url = `${baseUrl}/updateInvestmentGroups`;
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ groups: groups }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.status === 400) {
      //Some weird error
    } else if (response.status === 401) {
      throw new AuthorizationError("You are probably not logged in anymore");
    }
    else if (!response.ok) {
      throw new Error("Failed to update data!");
    }
  }
}