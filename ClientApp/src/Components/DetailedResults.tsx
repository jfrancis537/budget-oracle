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
      let resultMap = this.props.calculations.billResults.allBills[0];
      let avoidable: JSX.Element[] = [];
      let unavoidable: JSX.Element[] = [];
      for (let [bill, cost] of resultMap) {
        if (bill.unavoidable) {
          unavoidable.push(
            <div key={bill.id}>
              <label>{bill.name}:&nbsp;</label>
              <span>${cost}</span>
            </div>
          );
        } else {
          avoidable.push(
            <div key={bill.id}>
              <label>{bill.name}:&nbsp;</label>
              <span>${cost}</span>
            </div>
          );
        }

      }
      unavoidable.push(
        <div key='Investment Margin Interest'>
          <label>{"Margin Interest"}:&nbsp;</label>
          <span>${this.props.calculations.investmentResults.totalInterestOwed.toFixed(2)}</span>
        </div>
      );
      return (
        <>
          <Col>
            <h4>Avoidable</h4>
            {avoidable}
          </Col>
          <Col>
            <h4>Unavoidable</h4>
            {unavoidable}
          </Col>
        </>
      );
    } else {
      return null;
    }
  }

  private renderIncomeResults() {
    if (this.props.calculations) {
      const incomeResultMap = this.props.calculations.incomeResults[0];
      const components: JSX.Element[] = [];
      for (let [source, value] of incomeResultMap) {
        components.push(
          <div key={source.id}>
            <label>{source.name}:&nbsp;</label>
            <span>${value.amount} over {value.periods} periods</span>
          </div>
        );
      }
      const vestResultMap = this.props.calculations.scheduledVestsResult[0];
      for (let [schedule, value] of vestResultMap) {
        components.push(
          <div key={schedule.id}>
            <label>{schedule.name}:&nbsp;</label>
            <span>${value.amount} from {value.shares} shares</span>
          </div>
        );
      }
      const paymentResultMap = this.props.calculations.scheduledPaymentsResult[0];
      for (let [schedule, value] of paymentResultMap) {
        components.push(
          <div key={schedule.id}>
            <label>{schedule.name}:&nbsp;</label>
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
    if (this.props.calculations) {
      const totalInvestmentValue = this.props.calculations?.investmentResults.totalValue;
      const totalInvestmentCost = this.props.calculations?.investmentResults.totalCostBasis;
      const totalInvestmentGain = totalInvestmentValue - totalInvestmentCost;
      const totalVestGain = this.props.calculations.scheduledVestsResult[1];

      const billCalcs = this.props.calculations.billResults;
      const unavoidableCosts = billCalcs.unavoidableBills[1];
      const avoidableCosts = billCalcs.allBills[1] - unavoidableCosts;
      return (
        <>
          <Col>
            <h4>Investments</h4>
            <div>
              <label>Total Value:&nbsp;</label>
              <span>${totalInvestmentValue.toFixed(2)}</span>
            </div>
            <div>
              <label>Total Cost Basis:&nbsp;</label>
              <span>${totalInvestmentCost.toFixed(2)}</span>
            </div>
            <div>
              <label>Total Gain:&nbsp;</label>
              <span>${totalInvestmentGain.toFixed(2)}</span>
            </div>
            <div>
              <label>Total Gain (After LT Taxes):&nbsp;</label>
              <span>${(totalInvestmentGain * .85).toFixed(2)}</span>
            </div>
            <div>
              <label>Total Gain from Vests:&nbsp;</label>
              <span>${totalVestGain.toFixed(2)}</span>
            </div>
          </Col>
          <Col>
            <h4>Bills</h4>
            <div>
              <label>Unavoidable Costs</label>
              <span>${unavoidableCosts.toFixed(2)}</span>
            </div>
            <div>
              <label>Avoidable Costs</label>
              <span>${avoidableCosts.toFixed(2)}</span>
            </div>
          </Col>
        </>
      );
    } else {
      return null;
    }
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

    const windowHeight = Math.floor(window.document.body.clientHeight * .7);
    return (

      <>
        <Row className={styles["nav-container-row"]}>
          <Tabs currentTab={this.state.page} onChange={this.handlePageChange} options={options} className={styles["nav"]} />
        </Row>
        <Row className={styles["content-row"]} style={{ maxHeight: `${windowHeight}px` }}>
          <div ref={this.contentDivRef} className={styles.content}>
            {this.renderContent()}
          </div>
        </Row>
      </>
    );
  }
}