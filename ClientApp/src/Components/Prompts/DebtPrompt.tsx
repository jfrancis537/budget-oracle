import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { GroupManager, GroupType } from "../../Processing/Managers/GroupManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { LoadingButton } from "./LoadingButton";

export interface IDebtPromptProps {
  editing: boolean;
  groupName: string;
  debtToEdit?: string;
}

interface IDebtPromptState {
  name: string,
  value: number,
  isSaving: boolean
}

export class DebtPrompt extends React.Component<IDebtPromptProps, IDebtPromptState> {

  constructor(props: IDebtPromptProps) {
    super(props);

    if (this.props.editing) {
      const debtId = this.props.debtToEdit;
      if (debtId && AppStateManager.hasDebt(debtId)) {
        const account = AppStateManager.getDebt(debtId)!;
        this.state = {
          name: account.name,
          value: account.amount,
          isSaving: false
        }
      } else {
        throw new Error('An account to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        value: 0,
        isSaving: false
      };
    }

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.handleNameChanged = this.handleNameChanged.bind(this);
    this.handleValueChanged = this.handleValueChanged.bind(this);
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

  private async accept() {
    this.setState({
      isSaving: true
    });
    if (this.props.editing) {
      await AppStateManager.updateDebt(this.props.debtToEdit, this.state.name, this.state.value);
    } else {
      const debtId = await AppStateManager.addDebt(this.state.name, this.state.value);
      await GroupManager.addItemToGroup(debtId, GroupType.Debt, this.props.groupName);
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
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Debt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Name"
              aria-label="account name"
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