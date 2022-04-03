import React, { useEffect, useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { PlaidBalanceAccount } from "../../APIs/PlaidAPI";
import { PlaidManager } from "../../Processing/Managers/PlaidManager";

import itemStyles from '../../styles/Item.module.css';

interface IPlaidItemProps {
  id: string;
}

export const PlaidItem: React.FC<IPlaidItemProps> = (props) => {

  const [accounts, setAccounts] = useState<PlaidBalanceAccount[] | undefined>(undefined);

  useEffect(() => {
    PlaidManager.getBalancesForItem(props.id).then(accounts => {
      setAccounts(accounts);
    })
      .catch(err => {
        //TODO deal with Error
      });
  }, [props.id]);

  async function refresh() {
    let accounts = await PlaidManager.getBalancesForItem(props.id, true);
    if (accounts) {
      setAccounts(accounts);
    }
  }

  async function remove() {
    //TODO
  }

  function renderAccount(account: PlaidBalanceAccount) {
    const balance = account.balances?.available ?? account.balances?.current ?? 0;
    return (
      <div className={itemStyles['item-body']} key={account.accountId}>
        <ButtonGroup className="mr-2" size='sm'>
          <Button onClick={refresh} variant='primary'>
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
          <Button onClick={remove} variant='secondary'>
            <i className="bi bi-trash"></i>
          </Button>
        </ButtonGroup>
        <div>{account.name} : {balance}</div>
      </div>
    )
  }

  function render(): JSX.Element {
    if (accounts) {
      return (
        <>
          {accounts.map(renderAccount)}
        </>
      )
    }
    else {
      return <></>
    }
  }

  return render();
}