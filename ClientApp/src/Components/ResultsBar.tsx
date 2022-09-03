import React from "react";
import { Row, Navbar, Nav } from "react-bootstrap";
import { CalculationsManager, CalculationResult } from "../Processing/Managers/CalculationsManager";

import barStyles from '../styles/ResultsBar.module.css';
import mobileStyles from '../styles/MobileHelper.module.css';
import { MobileHelper } from "../Utilities/MobileUtils";
import { autobind } from "../Utilities/Decorators";
import { DetailedResults } from "./DetailedResults";
import { AnimatedHeightDiv } from "./Animation/AnimatedHeightDiv";
import { CalculationTools } from "../Utilities/CalculationTools";

interface ResultsBarState {
  calculations?: CalculationResult
  drawerOpen: boolean;
  drawerTransitioning: boolean;
  displayUnrealized: boolean;
}

export class ResultsBar extends React.Component<{}, ResultsBarState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      calculations: undefined,
      drawerOpen: false,
      drawerTransitioning: false,
      displayUnrealized: false
    }
  }

  async componentDidMount() {
    let results = await CalculationsManager.instance.requestCalculations();
    this.setState({
      calculations: results
    });
    CalculationsManager.instance.onresultscalculated.addListener(this.handleUpdatedCalculations);
  }

  componentWillUnmount() {
    CalculationsManager.instance.onresultscalculated.removeListener(this.handleUpdatedCalculations);
  }

  @autobind
  private handleUpdatedCalculations(results: CalculationResult) {
    this.setState({
      calculations: results
    });
  }

  private renderCalculations(): JSX.Element | JSX.Element[] {
    if (this.state.calculations) {
      const calcs = this.state.calculations;
      const totals = CalculationTools.calculateTotal(calcs, this.state.displayUnrealized);

      const hasGain = calcs.investmentResults.totalValue > calcs.investmentResults.totalCostBasis;
      const color = this.state.displayUnrealized ? (hasGain ? "lime" : "red") : undefined;
      return (
        <>
          <div className={barStyles['item']}>Expenses: ${(calcs.billResults.allBills[1] + calcs.investmentResults.totalInterestOwed).toFixed(2)}</div>
          <div className={barStyles['item']}>Income: ${(calcs.incomeResults[1] + calcs.scheduledVestsResult[1] + calcs.scheduledPaymentsResult[1]).toFixed(2)}</div>
          <div onClick={this.toggleDisplayUnrealized} className={`${barStyles['item']}`} style={{ color: color, cursor: "pointer" }} >Total: ${totals.toFixed(2)}</div>
        </>
      )
    } else {
      return <div className={barStyles['item']}>Results</div>
    }
  }

  @autobind
  private toggleDisplayUnrealized(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    this.setState({
      displayUnrealized: !this.state.displayUnrealized
    });
  }

  @autobind
  private toggleDrawer(event: React.MouseEvent<HTMLDivElement>) {
    this.setState({
      drawerOpen: !this.state.drawerOpen,
      drawerTransitioning: true
    });
    setTimeout(() => {
      this.setState({
        drawerTransitioning: false
      });
    }, 360);
  }

  @autobind
  private handleDrawerPageChanged() {
    this.setState({
      drawerTransitioning: true
    });
    setTimeout(() => {
      this.setState({
        drawerTransitioning: false
      });
    }, 360);
  }

  render() {

    const isIphoneInStandalone = MobileHelper.isiPhoneInStandalone();

    return (
      <Row className={barStyles["container-row"]}>
        <Navbar
          bg="dark"
          variant="dark"
          expand='md'
          className={`${barStyles['bar']} ${isIphoneInStandalone ? mobileStyles["pb-xs-40"] : ""}`}
          style={(this.state.drawerOpen || this.state.drawerTransitioning) ? { position: 'absolute' } : undefined}
        >
          <Nav style={{ width: "100%" }}>
            <div style={{ width: "100%" }}>
              <div className={barStyles['bar-item-area']} onClick={this.toggleDrawer}>
                {this.renderCalculations()}
              </div>
              <AnimatedHeightDiv open={this.state.drawerOpen}>
                <DetailedResults calculations={this.state.calculations} onPageChanged={this.handleDrawerPageChanged} />
              </AnimatedHeightDiv>
            </div>
          </Nav>
        </Navbar>
      </Row>
    )
  }
}