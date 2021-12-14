import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { InvestmentCalculationManager } from "../../Processing/Managers/InvestmentCalculationManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { Investment } from "../../Processing/Models/Investment";
import itemStyles from '../../styles/Item.module.css';
import { autobind } from "../../Utilities/Decorators";

interface IInvestmentItemProps {
  item: Investment;
}

interface IInvestmentItemState {
  value?: number;
}

export class InvestmentItem extends React.Component<IInvestmentItemProps, IInvestmentItemState>{

  constructor(props: IInvestmentItemProps) {
    super(props);
    this.state = {
      value: InvestmentCalculationManager.getExistingCalculation(props.item.id)
    }
  }

  componentDidMount() {
    InvestmentCalculationManager.oninvestmentvaluecalculated.addListener(this.onInvestmentCalculated);
  }

  componentWillUnmount() {
    InvestmentCalculationManager.oninvestmentvaluecalculated.removeListener(this.onInvestmentCalculated);
  }

  @autobind
  private onInvestmentCalculated(data: { id: string, value: number }) {
    if (this.props.item.id === data.id)
      this.setState({
        value: data.value
      });
  }

  @autobind
  public edit() {
    PromptManager.requestInvestmentPrompt({
      editing: true,
      investmentToEdit: this.props.item.id
    });
  }

  @autobind
  public async remove() {
    await AppStateManager.deleteItem(this.props.item.id);
  }

  @autobind
  private async refresh()
  {
    this.setState({
      value: undefined
    });
    await InvestmentCalculationManager.refreshSymbol(this.props.item);
  }

  public render() {
    return (
      <div className={itemStyles['item-body']}>
        <ButtonGroup className="mr-2" size='sm'>
          <Button onClick={this.edit}>
            <i className="bi bi-pencil"></i>
          </Button>
          <Button onClick={this.remove} variant='secondary'>
            <i className="bi bi-trash"></i>
          </Button>
          <Button onClick={this.refresh} variant='secondary'>
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
        </ButtonGroup>
        <div>{this.props.item.symbol} : {this.state.value?.toFixed(2) ?? "..."}</div>
      </div>
    );
  }
}