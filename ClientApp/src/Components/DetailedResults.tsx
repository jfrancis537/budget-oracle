import React from "react";
import { Col, Row } from "react-bootstrap";
import { CalculationResult } from "../Processing/Managers/CalculationsManager";
import { autobind } from "../Utilities/Decorators";
import { Tabs } from "./Tabs";

import styles from "../styles/DetailedResults.module.css";

enum DetailedResultsPage {
  Expenses = "expenses",
  Income = "income",
  Statistics = "stats"
}

interface IDetailedResultsProps {
  calculations?: CalculationResult
  onPageChanged?: (page: DetailedResultsPage) => void;
}

interface IDetailedResultsState {
  page: DetailedResultsPage
}

export class DetailedResults extends React.Component<IDetailedResultsProps, IDetailedResultsState> {

  private contentDivRef: React.RefObject<HTMLDivElement>;

  constructor(props: IDetailedResultsProps) {
    super(props);
    this.contentDivRef = React.createRef();
    this.state = {
      page: DetailedResultsPage.Expenses
    }
  }

  componentDidMount() {
    if (this.contentDivRef.current) {
      let div = this.contentDivRef.current;
      setTimeout(() => {
        div.style.height = window.getComputedStyle(div).height;
      }, 100);
    }
  }

  componentDidUpdate(oldProps: IDetailedResultsProps, oldState: IDetailedResultsState) {
    if (this.state.page !== oldState.page || this.props.calculations !== oldProps.calculations) {
      if (this.contentDivRef.current) {
        let div = this.contentDivRef.current;
        let startHeight = div.style.height;
        div.style.height = "";
        div.style.transition = "none";
        let endHeight = window.getComputedStyle(div).height;
        div.style.height = startHeight;

        requestAnimationFrame(() => {
          div!.style.transition = '';
          requestAnimationFrame(() => {
            div!.style.height = endHeight;
          });
        });
      }
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

  private renderExpenseResults() {
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
      components.push(
        <div key='Investment Margin Interest'>
          <label>{"Margin Interest"}:&nbsp;</label>
          <span>${this.props.calculations.investmentResults.totalInterestOwed.toFixed(2)}</span>
        </div>
      );
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

  private renderStats() {
    return (
      <Col>
        <div>
          <label>Investments Value:&nbsp;</label>
          <span>${this.props.calculations?.investmentResults.totalValue.toFixed(2)}</span>
        </div>
        <div>
          <label>Investments Cost Basis:&nbsp;</label>
          <span>${this.props.calculations?.investmentResults.totalCostBasis.toFixed(2)}</span>
        </div>
      </Col>
    );
  }

  private renderContent() {
    let result: JSX.Element | JSX.Element[] | null;
    switch (this.state.page) {
      case DetailedResultsPage.Expenses:
        result = this.renderExpenseResults();
        break;
      case DetailedResultsPage.Income:
        result = this.renderIncomeResults();
        break;
      case DetailedResultsPage.Statistics:
        result = this.renderStats();
        break;
    }
    return result;
  }

  public render() {

    let options: Map<DetailedResultsPage, string> = new Map([
      [DetailedResultsPage.Expenses, "Expenses"],
      [DetailedResultsPage.Income, "Income"],
      [DetailedResultsPage.Statistics, "Statistics"]
    ]);

    return (
      <>
        <Row className={styles["nav-container-row"]}>
          <Tabs currentTab={this.state.page} onChange={this.handlePageChange} options={options} className={styles["nav"]} />
        </Row>
        <Row>
          <div ref={this.contentDivRef} className={styles.content}>
            {this.renderContent()}
          </div>
        </Row>
      </>
    );
  }
}