import React from "react"
import { Button, Form,InputGroup, Modal } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { LoadingButton } from "./LoadingButton";

export interface IAccountPromptProps {
  editing: boolean;
  accountToEdit?: string;
}

interface AccountPromptState {
  name: string,
  value: number,
  isSaving: boolean,
  error?: string
}

export class AccountPrompt extends React.Component<IAccountPromptProps, AccountPromptState> {

  constructor(props: IAccountPromptProps) {
    super(props);

    if (this.props.editing) {
      const accountId = this.props.accountToEdit;
      if (accountId && AppStateManager.hasAccount(accountId)) {
        const account = AppStateManager.getAccount(accountId)!;
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
    try {
      if (this.props.editing) {
        await AppStateManager.updateAccount(this.props.accountToEdit, this.state.name, this.state.value);
      } else {
        await AppStateManager.addAccount(this.state.name, this.state.value);
      }
      PromptManager.requestClosePrompt();
    } catch (err)
    {
      console.log(err);
      this.setState({
        error: "Failed to update"
      });
    }
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
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Account Name"
              aria-label="account name"
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant={this.state.error ? "danger" : "primary"} onClick={this.accept} disabled={!this.state.name || this.state.isSaving}>
            {this.props.editing ? "Update" : "Add"}
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }
}