import React from "react";
import { FormControl, InputGroup } from "react-bootstrap";
import { Button, Modal } from "react-bootstrap";
import { LoginManager } from "../../Processing/Managers/LoginManager";
import { LinkButton } from "../LinkButton";

import loginStyles from "../../styles/LoginPrompt.module.css";
import { LoadingButton } from "./LoadingButton";

interface ILoginPromptProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface ILoginPromptState {
  username: string;
  password: string;
  confirmPassword: string;
  errorMessage: string | undefined;
  registering: boolean;
  isLoading: boolean;
}

export class LoginPrompt extends React.Component<ILoginPromptProps, ILoginPromptState> {

  constructor(props: ILoginPromptProps) {
    super(props);
    this.state = {
      username: "",
      password: "",
      confirmPassword: "",
      errorMessage: undefined,
      registering: false,
      isLoading: false
    }

    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.close = this.close.bind(this);
    this.handleUsernameChanged = this.handleUsernameChanged.bind(this);
    this.handlePasswordChanged = this.handlePasswordChanged.bind(this);
    this.handleConfirmPasswordChanged = this.handleConfirmPasswordChanged.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.onEntered = this.onEntered.bind(this);
    this.onExit = this.onExit.bind(this);
  }

  public componentDidUpdate(oldProps: ILoginPromptProps) {
    if (oldProps.isOpen !== this.props.isOpen) {
      if (this.props.isOpen) {
        this.clear();
        this.setState({
          registering: false
        });
      }
    }
  }

  private close() {
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  private clear() {
    this.setState({
      username: "",
      password: "",
      confirmPassword: "",
      errorMessage: undefined
    });
  }

  private async login() {
    this.setState({
      isLoading: true
    });
    try {
      await LoginManager.login(this.state.username, this.state.password);
      this.close();
    } catch (err) {
      if (err instanceof Error) {
        this.setState({
          errorMessage: err.message
        });
      }
    }
    this.setState({
      isLoading: false
    });
  }

  private async register() {
    this.setState({
      isLoading: true
    });
    try {
      await LoginManager.register(this.state.username, this.state.password, this.state.confirmPassword);
      this.close();
    } catch (err) {
      if (err instanceof Error) {
        this.setState({
          errorMessage: err.message
        });
      }
    }
    this.setState({
      isLoading: false
    });
  }

  private handleUsernameChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      username: event.target.value
    });
  }
  private handlePasswordChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      password: event.target.value
    });
  }
  private handleConfirmPasswordChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      confirmPassword: event.target.value
    });
  }

  private setRegistrationActive(yes: boolean) {
    this.clear();
    this.setState({
      registering: yes
    });
  }

  private renderConfirmPassword() {
    if (this.state.registering) {
      return (
        <InputGroup className="mb-3">
          <FormControl
            placeholder="Confirm Password"
            aria-label="ConfirmPassword"
            type="password"
            onChange={this.handleConfirmPasswordChanged}
            value={this.state.confirmPassword}
          />
        </InputGroup>
      )
    } else {
      return null;
    }
  }

  private renderError() {
    if (this.state.errorMessage) {
      return <span style={{ color: '#ff6f6f' }}>{this.state.errorMessage}</span>
    } else {
      return null;
    }
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      (this.state.registering ? this.register : this.login)();
    }
  }

  private onEntered() {
    document.addEventListener('keypress', this.handleKeyPress)
  }

  private onExit() {
    document.removeEventListener('keypress', this.handleKeyPress)
  }

  public render() {
    return (
      <Modal
        centered
        show={this.props.isOpen}
        onEntered={this.onEntered}
        onExit={this.onExit}
      >
        <Modal.Header>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Username"
              aria-label="Username"
              onChange={this.handleUsernameChanged}
              value={this.state.username}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Password"
              aria-label="Password"
              type="password"
              onChange={this.handlePasswordChanged}
              value={this.state.password}
            />
          </InputGroup>
          {this.renderConfirmPassword()}
          {this.renderError()}
        </Modal.Body>

        <Modal.Footer>
          <LinkButton className={loginStyles["register-link"]} onClick={() => this.setRegistrationActive(!this.state.registering)}>{this.state.registering ? "Login" : "Register"}</LinkButton>
          <Button variant="secondary" onClick={this.close}>Cancel</Button>
          <LoadingButton
            isLoading={this.state.isLoading}
            loadingText={this.state.registering ? "Registering..." : "Logging in..."}
            variant="primary"
            onClick={this.state.registering ? this.register : this.login}
            disabled={this.state.isLoading}
          >
            {!this.state.registering ? "Login" : "Register"}
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }
}