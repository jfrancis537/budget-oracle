import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { Bill } from "../../Processing/Models/Bill";

import itemStyles from '../../styles/Item.module.css';

interface IBillItemProps {
  bill: Bill;
  groupName: string;
}

export const BillItem: React.FC<IBillItemProps> = (props) => {

  function edit() {
    PromptManager.requestBillPrompt({
      billToEdit: props.bill.id,
      editing: true,
      groupName: props.groupName
    });
  }


  function remove() {
    
  }

  return (
    <div className={itemStyles['item-body']}>
      <ButtonGroup className="mr-2" size='sm'>
        <Button onClick={edit}>
          <i className="bi bi-pencil"></i>
        </Button>
        <Button onClick={remove} variant='secondary'>
          <i className="bi bi-trash"></i>
        </Button>
      </ButtonGroup>
      <div>{props.bill.name} : {props.bill.amount}</div>
    </div>
  );
};