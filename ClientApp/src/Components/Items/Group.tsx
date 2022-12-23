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
import { Currency } from "../Currency";

interface IGroupProps {
  name: string;
  items: Set<string>;
}

interface ICostGroupProps extends IGroupProps {
  type: GroupType;
}

abstract class Group<P extends IGroupProps, S = {}> extends React.Component<P, S> {
  protected abstract renderItem(id: string): JSX.Element | null;
  protected abstract add(): void;
  protected abstract delete(): Promise<void>;
  protected abstract renderTitle(): JSX.Element | string;
  protected abstract getItems(): string[]

  protected renderAdditionalButtons(): JSX.Element | null { return null; }

  public render() {
    return (
      <Card className={groupStyles['card']}  text='light'>
        <Card.Header className={groupStyles['header']}>
          <div className={groupStyles['group-title']}>{this.renderTitle()}</div>
          <div className={groupStyles['button-group']}>
            <ButtonGroup className="mr-2" size='sm'>
              <Button onClick={this.add}>
                <i className="bi bi-plus-square"></i>
              </Button>
              <Button onClick={this.delete} variant='secondary'>
                <i className="bi bi-trash"></i>
              </Button>
              {this.renderAdditionalButtons()}
            </ButtonGroup>
          </div>
        </Card.Header>
        <Card.Body className={groupStyles['items']} >
          {this.getItems().map(this.renderItem)}
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

  protected getItems(): string[] {
    return [...this.props.items];
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

  protected renderTitle() {
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

interface IInvestmentGroupState {
  mode: 'value' | 'change'
}

export class InvestmentGroup extends Group<IGroupProps, IInvestmentGroupState> {

  constructor(props: IGroupProps) {
    super(props);
    InvestmentManager.oninvestmentvaluecalculated.addListener(this.handleInvestmentCalculated);
    AppStateManager.oninvestmentsupdated.addListener(this.handleInvestmentsUpdated);
    this.state = {
      mode: 'value'
    };
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
  private refresh() {
    InvestmentManager.refreshSymbols(this.props.items);
  }

  @autobind
  protected renderItem(id: string): JSX.Element | null {
    let result: JSX.Element | null;
    const item = AppStateManager.getInvestment(id);
    if (item) {
      result = <InvestmentItem item={item} groupName={this.props.name} key={`${item.symbol}`} />
    } else {
      result = null;
    }
    return result;
  }

  protected renderAdditionalButtons(): JSX.Element | null {
    return (
      <Button onClick={this.refresh} variant='secondary'>
        <i className="bi bi-arrow-clockwise"></i>
      </Button>
    )
  }

  protected getItems(): string[] {
    return [...this.props.items].sort((a, b) => {
      const itemA = AppStateManager.getInvestment(a);
      const itemB = AppStateManager.getInvestment(b);
      if (itemA && itemB) {
        return itemA.symbol.localeCompare(itemB.symbol);
      } else if (!itemA) {
        return -1;
      } else if (!itemB) {
        return 1;
      }
      else {
        return 0;
      }
    });
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

  @autobind
  private changeMode() {
    this.setState({ mode: this.state.mode === 'change' ? 'value' : 'change' });
  }

  protected renderTitle(): JSX.Element {

    let valueReady = false;
    let costBasisTotal = 0;
    let totalValue = 0;
    let investmentsCalculated = 0;
    let gainColorIndex = 1;
    let value = 0;
    for (const id of this.props.items) {
      const investment = AppStateManager.getInvestment(id);
      if (investment) {
        investmentsCalculated++;
        costBasisTotal += investment.costBasisPerShare * investment.shares;
        totalValue += InvestmentManager.getExistingCalculation(id) ?? 0;
      }
    }
    if (investmentsCalculated > 0) {
      const change = totalValue - costBasisTotal;
      gainColorIndex = change > 0 ? 2 : (change < 0 ? 0 : 1);
      valueReady = true;
      value = this.state.mode === 'value' ? totalValue : change;
    }
    return (
      <>
        <span>{this.props.name}&nbsp;:&nbsp;</span>
        {valueReady ? <Currency amount={value} tag='span' onclick={this.changeMode}/> : <span>---</span>}
      </>
    );
  }

}