import { useEffect, useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { BalanceData, LinkedAccountDetails } from "../../APIs/TellerAPI";
import { TellerManager } from "../../Processing/Managers/TellerManager";

import itemStyles from '../../styles/Item.module.css';

interface LinkedAccountItemProps {
  account: LinkedAccountDetails;
}
export const LinkedAccountItem: React.FC<LinkedAccountItemProps> = (props) => {

  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    TellerManager.onlinkedbalanceupdated.addListener(handleBalanceUpdated);
    return () => {
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

  function remove() {
    //TODO remove account
  }

  function refresh() {
    setBalance(undefined);
    TellerManager.refreshAccount(props.account.id);
  }

  function render(): JSX.Element {

    const name = props.account.type === "credit" ? `Card: (${props.account.lastFour})` : props.account.name;

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
        <div>{name} : {balance ?? "---"}</div>
      </div>
    );
  }

  return render();
}