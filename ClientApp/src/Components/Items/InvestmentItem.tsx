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
  mode: "gain" | "total"
}

export class InvestmentItem extends React.Component<IInvestmentItemProps, IInvestmentItemState>{

  constructor(props: IInvestmentItemProps) {
    super(props);
    this.state = {
      value: InvestmentCalculationManager.getExistingCalculation(props.item.id),
      mode: "total"
    }
  }

  componentDidMount() {
    InvestmentCalculationManager.oninvestmentvaluecalculated.addListener(this.onInvestmentCalculated);
    InvestmentCalculationManager.onsymbolvaluecalculated.addListener(this.handleSymbolPriceUpdated);
  }

  componentWillUnmount() {
    InvestmentCalculationManager.oninvestmentvaluecalculated.removeListener(this.onInvestmentCalculated);
    InvestmentCalculationManager.onsymbolvaluecalculated.removeListener(this.handleSymbolPriceUpdated);
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
  private async handleSymbolPriceUpdated(data: { symbol: string, value: number }) {
    if (this.props.item.symbol.toLowerCase() === data.symbol.toLowerCase()) {
      this.setState({
        value: undefined
      });
      await InvestmentCalculationManager.refreshSymbol(this.props.item, false);
    }
  }

  @autobind
  private async refresh() {
    this.setState({
      value: undefined
    });
    await InvestmentCalculationManager.refreshSymbol(this.props.item, true);
  }

  private get costBasis() {
    return ((this.props.item.costBasisPerShare * this.props.item.shares) - this.props.item.marginDebt);
  }

  private get gainState(): -1 | 0 | 1 {
    let result: 0 | 1 | -1 = 0;
    if (this.state.value) {
      if (this.state.value > this.costBasis) {
        result = 1;
      } else if (this.state.value < this.costBasis) {
        result = -1;
      }
    }
    return result;
  }

  private get gainValue(): number | undefined {
    if (this.state.value) {
      return this.state.value - this.costBasis;
    } else {
      return undefined;
    }
  }

  @autobind
  private toggleViewMode() {
    this.setState({
      mode: this.state.mode === "total" ? "gain" : "total"
    });
  }

  public render() {
    const colors = ['#e76d6d', 'unset', 'lime'];
    const color = colors[this.gainState + 1];
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
        <div>
          <span className={itemStyles.clickable} onClick={this.toggleViewMode}>{this.props.item.symbol} : &nbsp;</span>
          {this.state.mode === "total" && <span style={{ color: color }}>{this.state.value?.toFixed(2) ?? "..."}</span>}
          {this.state.mode === "gain" && <span style={{ color: color }}>{this.gainValue?.toFixed(2) ?? "..."}</span>}
        </div>
      </div>
    );
  }
}