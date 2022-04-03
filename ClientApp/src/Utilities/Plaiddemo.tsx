import React, { useCallback, useEffect, useState } from "react";
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidAccount } from "react-plaid-link";

interface IPlaidLinkProps {

}

export const PlaidLink: React.FC<IPlaidLinkProps> = () => {

  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<PlaidAccount[] | null>(null);
  const [loading, setLoading] = useState(true);

  let isOauth = false;

  const onSuccess = useCallback(async (publicToken: string) => {
    setLoading(true);
    var resp = await fetch("/api/plaid/exchange/public_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
    var itemId = await resp.text();
    await getBalance(itemId);
  }, []);

  const createLinkToken = useCallback(async () => {
    // For OAuth, use previously generated Link token
    if (window.location.href.includes("?oauth_state_id=")) {
      const linkToken = localStorage.getItem('link_token');
      setToken(linkToken);
    } else {
      const response = await fetch("/api/plaid/create/link_token", {
        method: "POST"
      });
      const data = await response.text();
      setToken(data);
      localStorage.setItem("link_token", data);
    }
  }, [setToken]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess
  };

  // For OAuth, configure the received redirect URI
  if (window.location.href.includes("?oauth_state_id=")) {
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (token == null) {
      createLinkToken();
    }
    if (isOauth && ready) {
      open();
    }
  }, [token, isOauth, ready, open]);

  const getBalance = React.useCallback(async (itemId: string) => {
    setLoading(true);
    const response = await fetch(`/api/plaid/get/${itemId}/balance`, {
      method: "GET"
    });
    const data = await response.json();
    setData(data);
    setLoading(false);
  }, [setData, setLoading]);

  return (
    <div>
      <button onClick={() => open()
      } disabled={!ready}>
        <strong>Link account</strong>
      </button>

      {!loading &&
        data != null &&
        Object.entries(data).map((entry, i) => (
          <pre key={i}>
            <code>{JSON.stringify(entry[1], null, 2)}</code>
          </pre>
        )
        )}
    </div>
  )
}