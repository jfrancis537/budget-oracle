import { useCallback, useEffect, useState } from "react";
import { NavDropdown } from "react-bootstrap"
import { PlaidLinkOptions, usePlaidLink } from "react-plaid-link";
import { PlaidAPI } from "../../APIs/PlaidAPI";
import { PlaidManager } from "../../Processing/Managers/PlaidManager";

interface IPlaidDropdownProps {
  isLoggedIn: boolean;
}

export const PlaidDropdownItem: React.FC<IPlaidDropdownProps> = (props) => {

  const [linkToken, setLinkToken] = useState<string | undefined>(undefined);

  const createLinkToken = useCallback(async () => {
    const linkToken = await PlaidAPI.createLinkToken();
    if (linkToken) {
      setLinkToken(linkToken);
    } else {
      //TODO warn the user
    }
  }, [setLinkToken]);

  const onSuccess = useCallback(async (publicToken: string) => {
    var itemId = await PlaidAPI.exchangePublicToken(publicToken);
    if (itemId) {
      PlaidManager.addItem(itemId);
    } else {
      //TODO warn the user
    }
  }, []);

  const config: PlaidLinkOptions = {
    token: linkToken ?? null,
    onSuccess
  };

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (!linkToken && props.isLoggedIn) {
      createLinkToken();
    }
  }, [props.isLoggedIn, linkToken, ready, open]);

  return (
    <NavDropdown.Item disabled={!props.isLoggedIn || !ready} onClick={() => open()}>Link Account</NavDropdown.Item>
  )
}