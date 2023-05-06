import React from "react"
import { Button, Form, InputGroup, Modal, Table } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { InvestmentGroupManager } from "../../Processing/Managers/InvestmentGroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { CSVFile, CSVParseError, CSVParser } from "../../Utilities/CSVParser";
import { autobind } from "../../Utilities/Decorators";
import { FileLoader } from "../../Utilities/FileUtils";
import { CurrencyInput } from "../Inputs/CurrencyInput";
import { NumberInput } from "../Inputs/NumberInput";
import { LoadingButton } from "./LoadingButton";

import styles from '../../styles/InvestmentPrompt.module.css';
import { InvestmentOptions } from "../../Processing/Models/Investment";

enum EditMode {
  Individual,
  Upload
}

export interface IInvestmentPromptProps {
  editing: boolean;
  investmentToEdit?: string;
  groupName: string;
}

interface IInvestmentPromptState {
  name: string;
  shares: number;
  symbol: string;
  costBasisPerShare: number;
  marginDebt: number;
  marginInterestRate: number;
  isSaving: boolean;
  mode: EditMode;
  csv?: CSVFile<{
    symbol: any;
    units: any;
    cost_basis: any;
  }, string>
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
          isSaving: false,
          mode: EditMode.Individual,
          csv: undefined
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
        marginInterestRate: 0,
        mode: EditMode.Individual,
        csv: undefined
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
  private handleEditModeChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({
      mode: Number(event.currentTarget.value)
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
        this.state.marginInterestRate,
      );
    } else {
      let id = await AppStateManager.addInvestment(
        this.state.name,
        this.state.shares,
        this.state.symbol,
        this.state.costBasisPerShare,
        this.state.marginDebt,
        this.state.marginInterestRate
      );
      await InvestmentGroupManager.addItemToGroup(id, this.props.groupName);
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

  @autobind
  private async acceptUpload() {
    if (this.state.csv) {
      this.setState({
        isSaving: true
      });
      let investments = new Map<string, InvestmentOptions>();
      for (const line of this.state.csv) {
        if (!investments.has(line.symbol)) {
          const costBasisPerShare = Number((Number(line.cost_basis) / Number(line.units)).toFixed(2));
          let investment: InvestmentOptions = {
            shares: Number(line.units),
            name: line.symbol,
            symbol: line.symbol,
            costBasisPerShare: costBasisPerShare,
            marginDebt: 0,
            marginInterestRate: 0
          }
          investments.set(investment.symbol, investment);
        }
      }
      await InvestmentGroupManager.clearGroup(this.props.groupName);
      const ids = await AppStateManager.addInvestments([...investments.values()]);
      for (const id of ids) {
        await InvestmentGroupManager.addItemToGroup(id, this.props.groupName);
      }
    }
    this.setState({
      isSaving: false
    });
    PromptManager.requestClosePrompt();
  }

  @autobind
  private async upload() {
    try {
      const file = await FileLoader.openWithDialog();
      const csvText = await FileLoader.readAsText(file);
      const parser = new CSVParser(['symbol', 'units', 'cost_basis']);
      const csv = parser.parseStrict(csvText);
      this.setState({
        csv
      });
    } catch (err) {
      if (err instanceof CSVParseError) {
        throw err;
      } else {
        throw err;
      }
    }
  }

  private renderCsv(): JSX.Element | null {
    const csv = this.state.csv;
    if (csv) {
      const elements = new Map<string, JSX.Element>();
      for (let line of csv) {
        const costBasisPerShare = (Number(line.cost_basis) / Number(line.units));
        if (Number.isNaN(costBasisPerShare)) {
          return <div>Error</div>
        }
        if (!elements.has(line.symbol)) {
          elements.set(line.symbol, (
            <tr>
              <td>{line.symbol}</td>
              <td>{line.units}</td>
              <td>${costBasisPerShare.toFixed(2)}</td>
            </tr>
          ));
        }
      }
      return (
        <div className={styles['table-container']}>
          <Table responsive={"sm"}>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>#</th>
                <th>
                  <i className="bi bi-currency-dollar"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...elements.values()]}
            </tbody>
          </Table>
        </div>
      )
    }
    return null;
  }

  private renderIndividual() {
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Investment</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles['modal-body']}>
          {!this.props.editing && (
            <>
              <label>Mode</label>
              <Form.Select
                onChange={this.handleEditModeChanged}
                value={this.state.mode}
                disabled={this.props.editing}
              >
                <option value={EditMode.Individual}>Individual</option>
                <option value={EditMode.Upload}>Upload</option>
              </Form.Select>
            </>
          )}
          <label>General</label>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Name"
              aria-label="investment name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Symbol"
              aria-label="Ticker Symbol"
              onChange={this.handleSymbolChanged}
              value={this.state.symbol}
              maxLength={5}
            />
          </InputGroup>
          <label>Cost Basis</label>
          <InputGroup className="mb-3">
            <NumberInput
              defaultValue={this.state.shares}
              ariaLabel="Number of shares"
              onChange={this.handleSharesChanged}
            />
            <InputGroup.Text>Shares</InputGroup.Text>
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>@</InputGroup.Text>
            <CurrencyInput
              ariaLabel="Cost basis per share"
              defaultValue={this.state.costBasisPerShare}
              onChange={this.handleCostBasisChanged}
            />
            <InputGroup.Text>Per Share</InputGroup.Text>
          </InputGroup>
          <label>Margin</label>
          <InputGroup className="mb-3">
            <CurrencyInput
              ariaLabel="Margin Debt"
              defaultValue={this.state.marginDebt}
              onChange={this.handleMarginDebtChanged}
            />
            <InputGroup.Text>Margin Debt</InputGroup.Text>
          </InputGroup>
          <InputGroup className="mb-3">
            <NumberInput
              ariaLabel="Margin Interest Rate"
              defaultValue={this.state.marginInterestRate}
              onChange={this.handleMarginInterestChanged}
            />
            <InputGroup.Text>%</InputGroup.Text>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.state.name || this.state.isSaving}>
            {this.props.editing ? "Update" : "Add"}
          </LoadingButton>
        </Modal.Footer>
      </>
    );
  }

  private renderUpload() {
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>Upload Investments</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles['modal-body']}>
          <label>Mode</label>
          <Form.Select
            onChange={this.handleEditModeChanged}
            value={this.state.mode}
            disabled={this.props.editing}
          >
            <option value={EditMode.Individual}>Individual</option>
            <option value={EditMode.Upload}>Upload</option>
          </Form.Select>
          {this.renderCsv()}
          <div className={styles['upload-button-container']}>
            <Button onClick={this.upload}>Upload CSV</Button>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.cancel}>
              Cancel
            </Button>
            <LoadingButton
              isLoading={this.state.isSaving}
              loadingText="Saving..."
              variant="primary"
              onClick={this.acceptUpload}
              disabled={!this.state.csv || this.state.isSaving}>
              Accept
            </LoadingButton>
          </Modal.Footer>
        </Modal.Body>
      </>
    )
  }

  render() {
    return (
      <Modal
        show
        onHide={this.cancel}
        backdrop="static"
        keyboard={false}
        contentClassName={styles['modal']}
      >
        {this.state.mode === EditMode.Individual ?
          this.renderIndividual() :
          this.renderUpload()}
      </Modal>
    )
  }
}