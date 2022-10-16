import React from "react";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { GroupManager } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { IValued } from "../../Processing/Models/Valued";
import { autobind } from "../../Utilities/Decorators";
import { ValueItem } from "./ValueItem";

import groupStyles from '../../styles/Group.module.css';
import { InvestmentItem } from "./InvestmentItem";
import { InvestmentGroupManager } from "../../Processing/Managers/InvestmentGroupManager";
import { GroupType } from "../../Processing/Enums/GroupType";
import { InvestmentManager } from "../../Processing/Managers/InvestmentManger";

interface IGroupProps {
  name: string;
  items: Set<string>;
}

interface ICostGroupProps extends IGroupProps {
  type: GroupType;
}

abstract class Group<P extends IGroupProps> extends React.Component<P> {
  protected abstract renderItem(id: string): JSX.Element | null;
  protected abstract add(): void;
  protected abstract delete(): Promise<void>;
  protected abstract get title(): string;

  public render() {
    return (
      <Card className={groupStyles['card']} bg='dark' text='light'>
        <Card.Header className={groupStyles['header']}>
          <div className={groupStyles['group-title']}>{this.title}</div>
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


export class CostGroup extends Group<ICostGroupProps> {

  @autobind
  protected renderItem(id: string) {
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
      //throw new Error('Can not render item that does not exist.');
      result = null;
    }
    return result;
  }

  @autobind
  protected add() {
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

  @autobind
  protected async delete() {
    let yes = window.confirm("Are you sure you want to delete " + this.props.name + "?");
    if (yes) {
      await GroupManager.deleteGroup(this.props.name, this.props.type);
    }
  }

  protected get title() {
    if (this.props.type === GroupType.Debt) {
      let sum = 0;
      for (let id of this.props.items) {
        let item = AppStateManager.getDebt(id);
        sum += item?.amount ?? 0;
      }
      return `${this.props.name} : ${sum}`
    } else {
      return this.props.name;
    }
  }
}

export class InvestmentGroup extends Group<IGroupProps> {

  constructor(props: IGroupProps) {
    super(props);
    InvestmentManager.oninvestmentvaluecalculated.addListener(this.handleInvestmentCalculated);
    AppStateManager.oninvestmentsupdated.addListener(this.handleInvestmentsUpdated);
  }

  @autobind
  private handleInvestmentsUpdated() {
    this.forceUpdate();
  }

  @autobind
  private handleInvestmentCalculated(data: { id: string, value: number }) {
    if (this.props.items.has(data.id)) {
      this.handleInvestmentsUpdated();
    }
  }

  @autobind
  protected renderItem(id: string): JSX.Element | null {
    let result: JSX.Element | null;
    const item = AppStateManager.getInvestment(id);
    if (item) {
      result = <InvestmentItem item={item} groupName={this.props.name} key={`${item.symbol}`}/>
    } else {
      result = null;
    }
    return result;
  }

  @autobind
  protected add(): void {
    PromptManager.requestInvestmentPrompt({
      editing: false,
      groupName: this.props.name
    });
  }

  @autobind
  protected async delete(): Promise<void> {
    let yes = window.confirm("Are you sure you want to delete " + this.props.name + "?");
    if (yes) {
      InvestmentGroupManager.deleteGroup(this.props.name);
    }
  }

  protected get title(): string {
    let costBasisTotal = 0;
    let totalValue = 0;
    for (const id of this.props.items) {
      const investment = AppStateManager.getInvestment(id);
      if(investment)
      {
        costBasisTotal += investment.costBasisPerShare * investment.shares;
        totalValue += InvestmentManager.getExistingCalculation(id) ?? 0;
      }
    }
    return `${this.props.name} : ${totalValue}`;
  }

}