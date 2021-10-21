import React from "react";
import { Row, Navbar, Nav } from "react-bootstrap";
import { CalculationsManager, CalculationResult } from "../Processing/Managers/CalculationsManager";

import barStyles from '../styles/ResultsBar.module.css';

interface ResultsBarState {
  calculations: CalculationResult | undefined
}

export class ResultsBar extends React.Component<{}, ResultsBarState> {

  constructor(props: {}) {
    super(props);
    this.handleUpdatedCalculations = this.handleUpdatedCalculations.bind(this);
    this.state = {
      calculations: undefined
    }
  }

  async componentDidMount() {
    var results = await CalculationsManager.instance.requestCalculations();
    this.setState({
      calculations: results
    });
    CalculationsManager.instance.onresultscalculated.addListener(this.handleUpdatedCalculations);
  }

  componentWillUnmount() {
    CalculationsManager.instance.onresultscalculated.removeListener(this.handleUpdatedCalculations);
  }

  private handleUpdatedCalculations(results: CalculationResult) {
    this.setState({
      calculations: results
    });
  }

  private renderCalculations(): JSX.Element | JSX.Element[] {
    if (this.state.calculations) {
      const calcs = this.state.calculations;
      const totals = calcs.accountTotal + calcs.incomeTotal - calcs.debtTotal - calcs.billTotal;
      return [
        <div key='bill_results' className={barStyles['item']}>Bills: ${this.state.calculations.billTotal}</div>,
        <div key='income_results' className={barStyles['item']}>Income: ${this.state.calculations.incomeTotal}</div>,
        <div key='totals' className={barStyles['item']}>Total: ${totals}</div>,
      ]
    } else {
      return <div className={barStyles['item']}>Results</div>
    }
  }

  render() {
    return (
      <Row>
        <Navbar bg="dark" variant="dark" expand='md' className={barStyles['bar']}>
          <Nav>
            <div className={barStyles['bar-item-area']}>
              {this.renderCalculations()}
            </div>
          </Nav>
        </Navbar>
      </Row>
    )
  }
}