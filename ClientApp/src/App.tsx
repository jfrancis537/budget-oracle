import React from "react";
import { Container } from "react-bootstrap";
import { BottomTabs } from "./Components/BottomTabs";
import { ContentArea } from "./Components/ContentArea";
import { Prompts } from "./Components/Prompts/Prompts";
import { ResultsBar } from "./Components/ResultsBar";
import { UIHeader } from "./Components/UIHeader";

export class App extends React.Component {
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