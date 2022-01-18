import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { NumberInput } from "../Inputs/NumberInput";
import { LoadingButton } from "./LoadingButton";

export interface IInvestmentPromptProps {
  editing: boolean;
  investmentToEdit?: string;
}

interface IInvestmentPromptState {
  name: string;
  shares: number;
  symbol: string;
  costBasisPerShare: number;
  marginDebt: number;
  marginInterestRate: number;
  isSaving: boolean;
}

export class InvestmentPrompt extends React.Component<IInvestmentPromptProps, IInvestmentPromptState> {

  constructor(props: IInvestmentPromptProps) {
    super(props);

    if (this.props.editing) {
      const sourceId = this.props.investmentToEdit;
      if (sourceId && AppStateManager.hasInvestment(sourceId)) {
        const investment = AppStateManager.getInvestment(sourceId)!;
        this.state = {
          name: investment.name,
          shares: investment.shares,
          symbol: investment.symbol,
          costBasisPerShare: investment.costBasisPerShare,
          marginDebt: investment.marginDebt,
          marginInterestRate: investment.marginInterestRate,
          isSaving: false
        }
      } else {
        throw new Error('An account to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: "",
        shares: 0,
        symbol: "",
        costBasisPerShare: 0,
        isSaving: false,
        marginDebt: 0,
        marginInterestRate: 0
      };
    }
  }

  @autobind
  private handleNameChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      name: event.target.value
    });
  }

  @autobind
  private handleSymbolChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      symbol: event.target.value
    });
  }

  @autobind
  private handleSharesChanged(newValue: number) {
    this.setState({
      shares: newValue
    });
  }

  @autobind
  private handleCostBasisChanged(newValue: number) {
    this.setState({
      costBasisPerShare: newValue
    });
  }

  @autobind
  private handleMarginDebtChanged(newValue: number) {
    this.setState({
      marginDebt: newValue
    });
  }

  @autobind
  private handleMarginInterestChanged(newValue: number) {
    this.setState({
      marginInterestRate: newValue
    });
  }


  @autobind
  private async accept() {
    this.setState({
      isSaving: true
    });
    if (this.props.editing) {
      await AppStateManager.updateInvestment(
        this.props.investmentToEdit,
        this.state.name,
        this.state.shares,
        this.state.symbol,
        this.state.costBasisPerShare,
        this.state.marginDebt,
        this.state.marginInterestRate
      );
    } else {
      await AppStateManager.addInvestment(
        this.state.name,
        this.state.shares,
        this.state.symbol,
        this.state.costBasisPerShare,
        this.state.marginDebt,
        this.state.marginInterestRate
      );
    }
    this.setState({
      isSaving: false
    });
    PromptManager.requestClosePrompt();
  }

  @autobind
  private cancel() {
    PromptManager.requestClosePrompt();
  }

  render() {
    return (
      <Modal
        show
        onHide={this.cancel}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Income Source</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Name"
              aria-label="investment name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Symbol"
              aria-label="Ticker Symbol"
              onChange={this.handleSymbolChanged}
              value={this.state.symbol}
              maxLength={5}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text># of Shares</InputGroup.Text>
            </InputGroup.Prepend>
            <NumberInput
              defaultValue={this.state.shares}
              ariaLabel="Number of shares"
              onChange={this.handleSharesChanged}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>$ basis per Share</InputGroup.Text>
            </InputGroup.Prepend>
            <NumberInput
              ariaLabel="Cost basis per share"
              defaultValue={this.state.costBasisPerShare}
              onChange={this.handleCostBasisChanged}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>Margin Debt</InputGroup.Text>
            </InputGroup.Prepend>
            <NumberInput
              ariaLabel="Margin Debt"
              defaultValue={this.state.marginDebt}
              onChange={this.handleMarginDebtChanged}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>$ basis per Share</InputGroup.Text>
            </InputGroup.Prepend>
            <NumberInput
              ariaLabel="Cost basis per share"
              defaultValue={this.state.marginInterestRate}
              onChange={this.handleMarginInterestChanged}
            />
          </InputGroup>
          {/* <InputGroup className="mb-3"> //TODO investment type
            <InputGroup.Prepend>
              <InputGroup.Text>Pay Frequency</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              as='select'
              onChange={this.handleFrequencyChanged}
              value={this.state.incomeFrequency}
            >
              <option value={IncomeFrequency.Weekly}>Weekly</option>
              <option value={IncomeFrequency.BiWeeklyEven}>Bi-Weekly Even Weeks</option>
              <option value={IncomeFrequency.BiWeeklyOdd}>Bi-Weekly Odd Weeks</option>
              <option value={IncomeFrequency.SemiMonthlyMiddleOM}>Semi-Monthly (1st pay @ Middle of month)</option>
              <option value={IncomeFrequency.SemiMonthlyStartOM}>Semi-Monthly (1st pay @ start of month)</option>
              <option value={IncomeFrequency.Monthly}>Monthly</option>
              <option value={IncomeFrequency.Quarterly}>Quarterly</option>
              <option disabled value={IncomeFrequency.Anually}>Anually</option>
            </FormControl>
          </InputGroup> */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.state.name || this.state.isSaving}>
            {this.props.editing ? "Update" : "Add"}
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }
}