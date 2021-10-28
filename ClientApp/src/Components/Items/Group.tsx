import React from "react";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { GroupManager, GroupType } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { IValued } from "../../Processing/Models/Valued";

import groupStyles from '../../styles/Group.module.css';
import { ValueItem } from "./ValueItem";

interface IGroupProps {
  type: GroupType;
  name: string;
  items: Set<string>;
}

export class Group extends React.Component<IGroupProps> {

  constructor(props: IGroupProps) {
    super(props);
    this.renderItem = this.renderItem.bind(this);
    this.add = this.add.bind(this);
    this.delete = this.delete.bind(this);
  }

  private renderItem(id: string) {
    let result: JSX.Element | null;
    let item: IValued | undefined;
    if (this.props.type === GroupType.Bill) {
      item = AppStateManager.getBill(id);
    } else {
      item = AppStateManager.getDebt(id);
    }

    if (item) {
      result = (
        <ValueItem key={item.id} item={item} groupName={this.props.name} />
      );
    } else {
      throw new Error('Can not render item that does not exist.');
    }
    return result;
  }

  private add() {
    if (this.props.type === GroupType.Bill) {
      PromptManager.requestBillPrompt({
        editing: false,
        groupName: this.props.name
      });
    } else {
      PromptManager.requestDebtPrompt({
        editing: false,
        groupName: this.props.name
      });
    }
  }

  private async delete() {
    await GroupManager.deleteGroup(this.props.name, this.props.type);
  }

  render() {
    return (
      <Card className={groupStyles['card']} bg='dark' text='light'>
        <Card.Header className={groupStyles['header']}>
          <div className={groupStyles['group-title']}>{this.props.name}</div>
          <div className={groupStyles['button-group']}>
            <ButtonGroup className="mr-2" size='sm'>
              <Button onClick={this.add}>
                <i className="bi bi-plus-square"></i>
              </Button>
              <Button onClick={this.delete} variant='secondary'>
                <i className="bi bi-trash"></i>
              </Button>
            </ButtonGroup>
          </div>
        </Card.Header>
        <Card.Body className={groupStyles['items']}>
          {[...this.props.items].map(this.renderItem)}
        </Card.Body>
      </Card>
    );
  }
}
