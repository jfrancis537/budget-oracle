import { useEffect, useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { BalanceData, LinkedAccountDetails, TransactionData } from "../../APIs/TellerAPI";
import { TellerManager } from "../../Processing/Managers/TellerManager";

import itemStyles from '../../styles/Item.module.css';

interface LinkedAccountItemProps {
  account: LinkedAccountDetails;
  onValueUpdated?: (val: number) => void;
}
export const LinkedAccountItem: React.FC<LinkedAccountItemProps> = (props) => {

  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  useEffect(() => {
    TellerManager.onlinkedbalanceupdated.addListener(handleBalanceUpdated);
    TellerManager.onlinkedtransactionsupdated.addListener(handleTransactionsUpdated);
    return () => {
      TellerManager.onlinkedtransactionsupdated.removeListener(handleTransactionsUpdated);
      TellerManager.onlinkedbalanceupdated.removeListener(handleBalanceUpdated);
    }
  }, []);

  function handleBalanceUpdated(balanceData: BalanceData) {
    if (props.account.id === balanceData.id) {
      if (props.account.type === "credit") {
        setBalance(balanceData.current);
      } else {
        setBalance(balanceData.available);
      }
    }
  }

  function handleTransactionsUpdated(transactionData: TransactionData[]) {
    if (transactionData.length > 0 && props.account.id === transactionData[0].id) {
      setTransactions(transactionData);
    }
  }

  function remove() {
    TellerManager.delete(props.account.id);
  }

  function refresh() {
    setBalance(undefined);
    TellerManager.refreshAccount(props.account.id);
  }

  function getValue() {
    let result = "---";
    if (balance !== undefined) {
      if (props.account.type === "credit") {
        const transactionTotal = transactions.reduce((prev, next) => {
          if (next.status === "pending" && (next.type === "transaction" || next.type === "atm")) {
            return prev + next.amount;
          }
          return prev;
        }, 0);
        result = (balance + transactionTotal).toFixed(2);
      } else {
        result = balance.toFixed(2);
      }
    }
    return result;
  }

  function render(): JSX.Element {

    const name = props.account.type === "credit" ? `Card: (${props.account.lastFour})` : props.account.name;
    const value = getValue();
    return (
      <div className={itemStyles['item-body']}>
        <ButtonGroup className="mr-2" size='sm'>
          <Button onClick={refresh}>
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
          <Button onClick={remove} variant='secondary'>
            <i className="bi bi-trash"></i>
          </Button>
        </ButtonGroup>
        <div>{name} : {value}</div>
      </div>
    );
  }

  return render();
}