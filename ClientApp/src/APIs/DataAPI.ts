export interface BudgetData {
  stateData: string,
  groupData: string
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

  export async function updateState(state: string) {
    let url = `${baseUrl}/updateState`;
    let body = { state: state };
    console.log(body);
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error("Failed to get data.");
    }
  }

  export async function updateGroups(groups: string) {
    let url = `${baseUrl}/updateGroups`;
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ groups: groups }),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error("Failed to get data.");
    }
  }
}