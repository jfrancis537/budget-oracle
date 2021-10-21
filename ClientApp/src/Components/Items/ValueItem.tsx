import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { IValued } from "../../Processing/Models/Valued";

import itemStyles from '../../styles/Item.module.css';

interface ValueItemProps {
  item: IValued;
  groupName?: string;
}

export const ValueItem: React.FC<ValueItemProps> = (props) => {

  function edit() {
    PromptManager.requestPromptForItem(props.item, props.groupName);
  }

  function remove() {
    AppStateManager.deleteItem(props.item.id);
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
      <div>{props.item.name} : {props.item.amount}</div>
    </div>
  );
}