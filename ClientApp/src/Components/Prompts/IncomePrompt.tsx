import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { IncomeFrequency } from "../../Processing/Enums/IncomeFrequency";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { LoadingButton } from "./LoadingButton";

export interface IIncomePromptProps {
  editing: boolean;
  sourceToEdit?: string;
}

interface IIncomePromptState {
  name: string,
  value: number,
  incomeFrequency: IncomeFrequency,
  paysOnWeekends: boolean,
  dayOfMonth: number,
  isSaving: boolean
}

export class IncomePrompt extends React.Component<IIncomePromptProps, IIncomePromptState> {

  constructor(props: IIncomePromptProps) {
    super(props);

    if (this.props.editing) {
      const sourceId = this.props.sourceToEdit;
      if (sourceId && AppStateManager.hasIncomeSource(sourceId)) {
        const source = AppStateManager.getIncomeSource(sourceId)!;
        this.state = {
          name: source.name,
          value: source.amount,
          incomeFrequency: source.frequencyType,
          paysOnWeekends: source.paysOnWeekends,
          dayOfMonth: source.dayOfMonth,
          isSaving: false
        }
      } else {
        throw new Error('An account to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        value: 0,
        incomeFrequency: IncomeFrequency.Monthly,
        paysOnWeekends: false,
        dayOfMonth: 1,
        isSaving: false
      };
    }

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleValueChanged = this.handleValueChanged.bind(this);
    this.handleFrequencyChanged = this.handleFrequencyChanged.bind(this);
    this.handlePaysOnWeekendsChanged = this.handlePaysOnWeekendsChanged.bind(this);
    this.handleDayOfMonthChanged = this.handleDayOfMonthChanged.bind(this);
  }

  private handleNameChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      name: event.target.value
    });
  }

  private handleValueChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        value: Number(event.target.value)
      });
    }
  }

  private handleFrequencyChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({
      incomeFrequency: (Number(event.target.value) as IncomeFrequency)
    });
  }

  private handlePaysOnWeekendsChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value === `${true}`;
    this.setState({
      paysOnWeekends: value
    });
  }

  private handleDayOfMonthChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        dayOfMonth: newValue
      });
    }
  }

  private async accept() {
    this.setState({
      isSaving: true
    });
    if (this.props.editing) {
      await AppStateManager.updateIncomeSource(
        this.props.sourceToEdit,
        this.state.name,
        this.state.value,
        this.state.incomeFrequency,
        this.state.paysOnWeekends,
        this.state.dayOfMonth
      );
    } else {
      await AppStateManager.addIncomeSource(
        this.state.name,
        this.state.value,
        this.state.incomeFrequency,
        this.state.paysOnWeekends,
        this.state.dayOfMonth);
    }
    this.setState({
      isSaving: false
    });
    PromptManager.requestClosePrompt();
  }

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
              aria-label="income source name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>$</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              aria-label="Amount (to the nearest dollar)"
              onChange={this.handleValueChanged}
              value={this.state.value}
            />
          </InputGroup>
          <InputGroup className="mb-3">
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
          </InputGroup>
          <InputGroup
            className="mb-3"
            hidden={
              this.state.incomeFrequency <= IncomeFrequency.BiWeeklyOdd ||
              this.state.incomeFrequency >= IncomeFrequency.Monthly
            }
          >
            <InputGroup.Prepend>
              <InputGroup.Text>Pays on Weekends</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              as='select'
              onChange={this.handlePaysOnWeekendsChanged}
              value={`${this.state.paysOnWeekends}`}
            >
              <option value={`${true}`}>Yes</option>
              <option value={`${false}`}>No</option>
            </FormControl>
          </InputGroup>
          <InputGroup
            className="mb-3"
            hidden={this.state.incomeFrequency !== IncomeFrequency.Monthly}
          >
            <InputGroup.Prepend>
              <InputGroup.Text>Day of Month</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              as='select'
              onChange={this.handleDayOfMonthChanged}
              value={`${this.state.dayOfMonth}`}
            >
              {function () {
                let results: JSX.Element[] = [];
                for (let i = 1; i <= 28; i++) {
                  results.push(<option key={`option_${i}`} value={`${i}`}>{i}</option>);
                }
                return results;
              }()}
            </FormControl>
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
      </Modal>
    )
  }
}