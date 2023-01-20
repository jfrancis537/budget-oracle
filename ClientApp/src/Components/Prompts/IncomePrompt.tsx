import moment, { Moment } from "moment";
import React from "react"
import { Button, Form, InputGroup, Modal } from "react-bootstrap"
import { IncomeFrequency } from "../../Processing/Enums/IncomeFrequency";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { DatePicker } from "../Inputs/DatePicker";
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
  startDate: Moment,
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
          startDate: source.startDate,
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
        isSaving: false,
        startDate: moment()
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
  private handleValueChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        value: Number(event.target.value)
      });
    }
  }

  @autobind
  private handleStartDateChanged(date: Moment) {
    this.setState({
      startDate: date
    });
  }

  @autobind
  private handleFrequencyChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({
      incomeFrequency: (Number(event.target.value) as IncomeFrequency)
    });
  }

  @autobind
  private handlePaysOnWeekendsChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value === `${true}`;
    this.setState({
      paysOnWeekends: value
    });
  }

  @autobind
  private handleDayOfMonthChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        dayOfMonth: newValue
      });
    }
  }

  @autobind
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
        this.state.dayOfMonth,
        this.state.startDate
      );
    } else {
      await AppStateManager.addIncomeSource(
        this.state.name,
        this.state.value,
        this.state.incomeFrequency,
        this.state.paysOnWeekends,
        this.state.dayOfMonth,
        this.state.startDate
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
            <Form.Control
              placeholder="Name"
              aria-label="income source name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>$</InputGroup.Text>
            <Form.Control
              aria-label="Amount (to the nearest dollar)"
              onChange={this.handleValueChanged}
              value={this.state.value}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>Pay Frequency</InputGroup.Text>
            <Form.Select
              onChange={this.handleFrequencyChanged}
              value={this.state.incomeFrequency}
            >
              <option value={IncomeFrequency.Weekly}>Weekly</option>
              <option value={IncomeFrequency.Biweekly}>Bi-Weekly</option>
              <option value={IncomeFrequency.SemiMonthlyMiddleOM}>Semi-Monthly (1st pay @ Middle of month)</option>
              <option value={IncomeFrequency.SemiMonthlyStartOM}>Semi-Monthly (1st pay @ start of month)</option>
              <option value={IncomeFrequency.Monthly}>Monthly</option>
              <option value={IncomeFrequency.Quarterly}>Quarterly</option>
              <option disabled value={IncomeFrequency.Anually}>Anually</option>
            </Form.Select>
          </InputGroup>
          <InputGroup className="mb-3" hidden={this.state.incomeFrequency !== IncomeFrequency.Biweekly}>
            <InputGroup.Text>
              <i className="bi bi-calendar-event" />
            </InputGroup.Text>
            <DatePicker defaultDate={this.state.startDate} calendarIconBackgroundEnabled className="form-control" onChange={this.handleStartDateChanged} />
          </InputGroup>
          <InputGroup
            className="mb-3"
            hidden={
              this.state.incomeFrequency <= IncomeFrequency.Biweekly ||
              this.state.incomeFrequency >= IncomeFrequency.Monthly
            }
          >
            <InputGroup.Text>Pays on Weekends</InputGroup.Text>
            <Form.Select
              onChange={this.handlePaysOnWeekendsChanged}
              value={`${this.state.paysOnWeekends}`}
            >
              <option value={`${true}`}>Yes</option>
              <option value={`${false}`}>No</option>
            </Form.Select>
          </InputGroup>
          <InputGroup
            className="mb-3"
            hidden={this.state.incomeFrequency !== IncomeFrequency.Monthly}
          >
            <InputGroup.Text>Day of Month</InputGroup.Text>
            <Form.Select
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
            </Form.Select>
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