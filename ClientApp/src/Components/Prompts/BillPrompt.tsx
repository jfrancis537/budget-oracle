import moment, { Moment } from "moment";
import React from "react"
import { Button, Form, InputGroup, Modal } from "react-bootstrap"
import { FrequencyType } from "../../Processing/Enums/FrequencyType";
import { GroupType } from "../../Processing/Enums/GroupType";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { GroupManager } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { CurrencyInput } from "../Inputs/CurrencyInput";
import { LoadingButton } from "./LoadingButton";

export interface IBillPromptProps {
  editing: boolean;
  groupName: string;
  billToEdit?: string;
}

interface BillPromptState {
  name: string,
  value: number,
  frequency: number,
  frequencyType: FrequencyType,
  initalDate: Moment,
  unavoidable: boolean,
  isSaving: boolean
}

export class BillPrompt extends React.Component<IBillPromptProps, BillPromptState> {

  constructor(props: IBillPromptProps) {
    super(props);

    if (this.props.editing) {
      const billId = this.props.billToEdit;
      if (billId && AppStateManager.hasBill(billId)) {
        const bill = AppStateManager.getBill(billId)!;
        this.state = {
          name: bill.name,
          value: bill.amount,
          frequencyType: bill.frequencyType,
          frequency: bill.frequency,
          initalDate: bill.initialDate,
          unavoidable: bill.unavoidable,
          isSaving: false
        }
      } else {
        throw new Error('A Bill to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        value: 0,
        initalDate: moment(),
        frequency: 1,
        frequencyType: FrequencyType.Monthly,
        isSaving: false,
        unavoidable: false
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
  private handleUnavoidableChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      unavoidable: event.target.checked
    });
  }

  @autobind
  private handleValueChanged(newVal: number) {
    this.setState({
      value: newVal
    });
  }

  @autobind
  private handleDateChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const value = moment(event.target.value);
    if (value.isValid()) {
      this.setState({
        initalDate: value
      });
    }
  }

  @autobind
  private handleFrequencyTypeChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        frequencyType: Number(event.target.value)
      });
    }
  }

  @autobind
  private handleFrequencyChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        frequency: Number(event.target.value)
      });
    }
  }

  @autobind
  private async accept() {
    this.setState({
      isSaving: true
    });
    if (this.props.editing) {
      await AppStateManager.updateBill(
        this.props.billToEdit,
        this.state.name,
        this.state.value,
        this.state.frequency,
        this.state.frequencyType,
        this.state.initalDate,
        this.state.unavoidable
      );
    } else {
      let billId = await AppStateManager.addBill(
        this.state.name,
        this.state.value,
        this.state.frequency,
        this.state.frequencyType,
        this.state.initalDate,
        this.state.unavoidable
      );
      await GroupManager.addItemToGroup(billId, GroupType.Bill, this.props.groupName);
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
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Name"
              aria-label="name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <CurrencyInput
              ariaLabel="Bill amount"
              defaultValue={this.state.value}
              onChange={this.handleValueChanged}
              symbolLocation='label'
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>Interval</InputGroup.Text>
            <Form.Control
              aria-label="interval"
              onChange={this.handleFrequencyChanged}
              value={this.state.frequency}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>Frequency</InputGroup.Text>
            <Form.Select
              onChange={this.handleFrequencyTypeChanged}
              value={this.state.frequencyType}
            >
              <option value={FrequencyType.Daily}>Daily</option>
              <option value={FrequencyType.Weekly}>Weekly</option>
              <option value={FrequencyType.Monthly}>Monthly</option>
              <option value={FrequencyType.Anually}>Anually</option>
            </Form.Select>
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Text>Inital Date</InputGroup.Text>
            <Form.Control
              type='date'
              aria-label="date"
              onChange={this.handleDateChanged}
              value={this.state.initalDate.format("YYYY-MM-DD")}
            />
          </InputGroup>
          <InputGroup>
            <Form.Group>
              <Form.Check
                label="Unavoidable"
                type="checkbox"
                aria-label="unavoiadable bill"
                onChange={this.handleUnavoidableChanged}
                checked={this.state.unavoidable}
              />
            </Form.Group>
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