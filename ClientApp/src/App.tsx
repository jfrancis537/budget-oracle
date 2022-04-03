import React from "react";
import { Container } from "react-bootstrap";
import { ContentArea } from "./Components/ContentArea";
import { Prompts } from "./Components/Prompts/Prompts";
import { ResultsBar } from "./Components/ResultsBar";
import { UIHeader } from "./Components/UIHeader";
import { UserManager } from "./Processing/Managers/UserManager";
import { autobind } from "./Utilities/Decorators";

interface IAppState {
  isLoggedIn: boolean;
}

export class App extends React.Component<{}, IAppState> {

  componentDidMount() {
    UserManager.onuserloggedin.addListener(this.onUserLoggedIn);
    UserManager.onuserloggedout.addListener(this.onUserLoggedOut);
  }

  componentWillUnmount() {
    UserManager.onuserloggedin.removeListener(this.onUserLoggedIn);
    UserManager.onuserloggedout.removeListener(this.onUserLoggedOut);
  }

  @autobind
  private onUserLoggedIn() {
    this.setState({
      isLoggedIn: true
    });
  }

  @autobind
  private onUserLoggedOut() {
    this.setState({
      isLoggedIn: false
    });
  }

  render() {
    return (
      <Container fluid id="main_layout">
        <UIHeader />
        <ContentArea />
        <ResultsBar />
        <Prompts />
      </Container>
    )
  }
}