import React from "react"
import { Button, FormControl, InputGroup, Modal } from "react-bootstrap"
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { UserManager } from "../../Processing/Managers/UserManager";
import { LoadingButton } from "./LoadingButton";

export interface IStockAPIKeyPromptProps {
}

interface IStockAPIKeyPromptState {
  key: string,
  isSaving: boolean
}

export class StockAPIKeyPrompt extends React.Component<IStockAPIKeyPromptProps, IStockAPIKeyPromptState> {

  constructor(props: IStockAPIKeyPromptProps) {
    super(props);

    this.state = {
      key: "",
      isSaving: false
    }

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.handleKeyChanged = this.handleKeyChanged.bind(this);
  }

  private handleKeyChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      key: event.target.value
    });
  }

  private async accept() {
    this.setState({
      isSaving: true
    });
    await UserManager.setStockAPIKey(this.state.key);
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
          <Modal.Title>Set AlphaVantage™ API Key</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="API Key"
              aria-label="api key"
              onChange={this.handleKeyChanged}
              value={this.state.key}
            />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.state.key || this.state.isSaving}>
            Save
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }
}