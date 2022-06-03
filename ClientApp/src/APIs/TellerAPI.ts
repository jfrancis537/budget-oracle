import { TellerEnrollment } from "../Types/Teller"

export interface LinkedAccountDetails {
  name: string
  enrollmentId: string
  userId: string
  type: "credit" | "depository"
  balanceUrl: string
  id: string
  lastFour: string
}

export interface BalanceData {
  id: string;
  current: number;
  available: number;
}

export namespace TellerAPI {
  const baseUrl = "/api/teller";
  //Application Id
  export async function getApplicationId() {
    const url = `${baseUrl}/get/appid`;
    let response = await fetch(url);
    if (response.ok) {
      return response.text();
    } else {
      throw new Error("Failed to get application id for teller");
    }
  }
  //User Id
  export async function getUserId() {
    const url = `${baseUrl}/get/userid`;
    let response = await fetch(url);
    if (response.ok) {
      return response.text();
    } else if (response.status === 404) {
      return undefined;
    }
    else {
      throw new Error("Failed to get application id for teller");
    }
  }

  //Accounts
  export async function getLinkedAccountDetailsForEnrollment(enrollment: TellerEnrollment) {
    const url = `${baseUrl}/get/accounts`;
    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(enrollment),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      return (await response.json()) as LinkedAccountDetails[];
    }
    else {
      throw new Error("Failed to get linked accounts for enrollment");
    }
  }

  export async function getAccountBalance(accountId: string) {
    const url = `${baseUrl}/get/balance/${accountId}`;
    let response = await fetch(url);
    if (response.ok) {
      return (await response.json()) as BalanceData;
    }
    else {
      throw new Error("Failed to get linked accounts");
    }
  }

  export async function getAllLinkedAccounts() {
    const url = `${baseUrl}/get/accounts/all`;
    let response = await fetch(url);
    if (response.ok) {
      return (await response.json()) as LinkedAccountDetails[];
    }
    else {
      throw new Error("Failed to get linked accounts");
    }
  }
  //User id
  export async function setTellerUserId(id: string) {
    const url = `${baseUrl}/set/userid/${id}`;
    let response = await fetch(url, {
      method: "PUT"
    });
    if (!response.ok) {
      throw new Error("Failed to set user id");
    }
  }

  //Add Accounts
  export async function addLinkedAccounts(accounts: LinkedAccountDetails[]): Promise<LinkedAccountDetails[]> {
    const url = `${baseUrl}/add/accounts`;
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify(accounts),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      return accounts;
    } else {
      //TODO handle error
      throw new Error("Failed to add accounts");
    }
  }
}