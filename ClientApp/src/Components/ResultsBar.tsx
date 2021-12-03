import React from "react";
import { Row, Navbar, Nav, Col } from "react-bootstrap";
import { CalculationsManager, CalculationResult } from "../Processing/Managers/CalculationsManager";

import barStyles from '../styles/ResultsBar.module.css';
import mobileStyles from '../styles/MobileHelper.module.css';
import { MobileHelper } from "../Utilities/MobileUtils";
import { autobind } from "../Utilities/Decorators";
import { Divider } from "./UIElements/Divider";

interface ResultsBarState {
  calculations: CalculationResult | undefined
  drawerOpen: boolean;
  drawerTransitioning: boolean;
}

export class ResultsBar extends React.Component<{}, ResultsBarState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      calculations: undefined,
      drawerOpen: false,
      drawerTransitioning: false
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

  @autobind
  private handleUpdatedCalculations(results: CalculationResult) {
    this.setState({
      calculations: results
    });
  }

  private renderCalculations(): JSX.Element | JSX.Element[] {
    if (this.state.calculations) {
      const calcs = this.state.calculations;
      const totals = calcs.accountTotal + calcs.incomeTotal - calcs.debtTotal - calcs.billResults[1];
      return (
        <>
          <div className={barStyles['item']}>Bills: ${this.state.calculations.billResults[1]}</div>
          <div className={barStyles['item']}>Income: ${this.state.calculations.incomeTotal}</div>
          <div className={barStyles['item']}>Total: ${totals}</div>
        </>
      )
    } else {
      return <div className={barStyles['item']}>Results</div>
    }
  }

  private renderBillResults() {
    let resultMap = this.state.calculations!.billResults[0];
    let components: JSX.Element[] = [];
    for (let [bill, cost] of resultMap) {
      components.push(
        <div key={bill.id}>
          <label>{bill.name}:&nbsp;</label>
          <span>${cost}</span>
        </div>
      );
    }
    return components;
  }

  private renderAdditionalDetails(): JSX.Element | null {
    if (this.state.calculations) {
      return (
        <>
          <Row>
            <Col>
              <h3>Bills</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              {this.renderBillResults()}
            </Col>
          </Row>
        </>
      )
    } else {
      return null;
    }

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
              <Divider visible={this.state.drawerOpen && !this.state.drawerTransitioning} />
              <div className={`${barStyles["drawer"]} ${this.state.drawerOpen ? barStyles["open"] : barStyles["closed"]} ${this.state.drawerTransitioning ? barStyles["transitioning"] : ""}`} >
                {this.renderAdditionalDetails()}
              </div>
            </div>
          </Nav>
        </Navbar>
      </Row>
    )
  }
}