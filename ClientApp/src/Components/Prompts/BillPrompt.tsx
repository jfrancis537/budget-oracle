import moment, { Moment } from "moment";
import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { FrequencyType } from "../../Processing/Enums/FrequencyType";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { GroupManager, GroupType } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
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
        isSaving: false
      };
    }

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleValueChanged = this.handleValueChanged.bind(this);
    this.handleDateChanged = this.handleDateChanged.bind(this);
    this.handleFrequencyTypeChanged = this.handleFrequencyTypeChanged.bind(this);
    this.handleFrequencyChanged = this.handleFrequencyChanged.bind(this);
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

  private handleDateChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const value = moment(event.target.value);
    if (value.isValid()) {
      this.setState({
        initalDate: value
      });
    }
  }

  private handleFrequencyTypeChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        frequencyType: Number(event.target.value)
      });
    }
  }

  private handleFrequencyChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      this.setState({
        frequency: Number(event.target.value)
      });
    }
  }

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
        this.state.initalDate
      );
    } else {
      let billId = await AppStateManager.addBill(
        this.state.name,
        this.state.value,
        this.state.frequency,
        this.state.frequencyType,
        this.state.initalDate
      );
      await GroupManager.addItemToGroup(billId, GroupType.Bill, this.props.groupName);
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
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Name"
              aria-label="name"
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
              <InputGroup.Text>Interval</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              aria-label="interval"
              onChange={this.handleFrequencyChanged}
              value={this.state.frequency}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>Frequency</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              as='select'
              onChange={this.handleFrequencyTypeChanged}
              value={this.state.frequencyType}
            >
              <option value={FrequencyType.Daily}>Daily</option>
              <option value={FrequencyType.Weekly}>Weekly</option>
              <option value={FrequencyType.Monthly}>Monthly</option>
              <option value={FrequencyType.Anually}>Anually</option>
            </FormControl>
          </InputGroup>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>Inital Date</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              type='date'
              aria-label="date"
              onChange={this.handleDateChanged}
              value={this.state.initalDate.format("YYYY-MM-DD")}
            />
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