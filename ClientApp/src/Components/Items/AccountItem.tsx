import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { Account } from "../../Processing/Models/Account";

import itemStyles from '../../styles/Item.module.css';

interface AccountItemProps {
  account: Account;
}

export const AccountItem: React.FC<AccountItemProps> = (props) => {

  function edit() {
    PromptManager.requestAccountPrompt({
      accountToEdit: props.account.id,
      editing: true
    });
  }

  function remove() {

  }

  return (
    <div className={itemStyles['item-body']}>
      <ButtonGroup className="mr-2" size='sm'>
        <Button onClick={edit}>a
          <i className="bi bi-pencil"></i>
        </Button>
        <Button onClick={remove} variant='secondary'>
          <i className="bi bi-trash"></i>
        </Button>
      </ButtonGroup>
      <div>{props.account.name} : {props.account.amount}</div>
    </div>
  );
}