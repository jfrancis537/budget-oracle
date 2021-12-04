import React from "react";
import { Col, Row } from "react-bootstrap";
import { CalculationResult } from "../Processing/Managers/CalculationsManager";
import { autobind } from "../Utilities/Decorators";
import { Tabs } from "./Tabs";

import styles from "../styles/DetailedResults.module.css";

enum DetailedResultsPage {
  Bills = "bills",
  Income = "income"
}

interface IDetailedResultsProps {
  calculations?: CalculationResult
  onPageChanged?: (page: DetailedResultsPage) => void;
}

interface IDetailedResultsState {
  page: DetailedResultsPage
}

export class DetailedResults extends React.Component<IDetailedResultsProps, IDetailedResultsState> {
  constructor(props: IDetailedResultsProps) {
    super(props);

    this.state = {
      page: DetailedResultsPage.Bills
    }
  }

  @autobind
  private handlePageChange(page: DetailedResultsPage) {
    this.setState({
      page: page
    });
    if (this.props.onPageChanged) {
      this.props.onPageChanged(page)
    }
  }

  private renderBillResults() {
    if (this.props.calculations) {
      let resultMap = this.props.calculations.billResults[0];
      let components: JSX.Element[] = [];
      for (let [bill, cost] of resultMap) {
        components.push(
          <div key={bill.id}>
            <label>{bill.name}:&nbsp;</label>
            <span>${cost}</span>
          </div>
        );
      }
      return (
        <Col>
          {components}
        </Col>
      );
    } else {
      return null;
    }
  }

  private renderIncomeResults() {
    if (this.props.calculations) {
      let resultMap = this.props.calculations.incomeResults[0];
      let components: JSX.Element[] = [];
      for (let [source, value] of resultMap) {
        components.push(
          <div key={source.id}>
            <label>{source.name}:&nbsp;</label>
            <span>${value}</span>
          </div>
        );
      }
      return (
        <Col>
          {components}
        </Col>
      );
    } else {
      return null;
    }
  }

  private renderContent() {
    let result: JSX.Element | JSX.Element[] | null;
    switch (this.state.page) {
      case DetailedResultsPage.Bills:
        result = this.renderBillResults();
        break;
      case DetailedResultsPage.Income:
        result = this.renderIncomeResults();
        break;
    }
    return result;
  }

  public render() {

    let options: Map<DetailedResultsPage, string> = new Map([
      [DetailedResultsPage.Bills, "Bills"],
      [DetailedResultsPage.Income, "Income"]
    ]);

    return (
      <>
        <Row className={styles["nav-container-row"]}>
          <Tabs currentTab={this.state.page} onChange={this.handlePageChange} options={options} className={styles["nav"]} />
        </Row>
        <Row>
          {this.renderContent()}
        </Row>
      </>
    );
  }
}