import { PlaidAccount } from "react-plaid-link";

export interface PlaidBalanceAccount extends PlaidAccount {
  balances?: {
    available: number | null,
    current: number | null,
    isoCurrencyCode: string | null,
    lastUpdatedDateTime: string | null,
    limit: number | null,
    unofficialCurrencyCode: string | null
  }
  id: never,
  accountId: string
}

export namespace PlaidAPI {
  export async function createLinkToken() {
    const response = await fetch("/api/plaid/create/link_token", {
      method: "POST"
    });
    if (response.ok) {
      const token = await response.text();
      return token;
    } else {
      return undefined;
    }
  }

  /**
   * @param publicToken 
   * @returns An itemId for the created access token or undefined if a bad request was sent
   */
  export async function exchangePublicToken(publicToken: string) {
    var resp = await fetch("/api/plaid/exchange/public_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
    if (resp.ok) {
      return await resp.text();
    } else {
      return undefined;
    }
  }

  export async function getBalances(itemId: string) {
    const response = await fetch(`/api/plaid/get/${itemId}/balance`, {
      method: "GET"
    });
    if (response.ok) {
      const data: PlaidBalanceAccount[] = await response.json();
      return data;
    } else {
      return undefined;
    }
  }

  export async function getAllItems() {
    const response = await fetch(`/api/plaid/get/items`, {
      method: "GET"
    });
    if (response.ok) {
      const data: string[] = await response.json();
      return data;
    } else {
      return undefined;
    }
  }
}