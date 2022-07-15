import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Account } from "../Processing/Models/Account";
import { AppStateManager } from "../Processing/Managers/AppStateManager";
import { GroupManager, GroupsData, GroupType } from "../Processing/Managers/GroupManager";
import contentStyles from '../styles/ContentArea.module.css';
import mobileStyles from '../styles/MobileHelper.module.css';
import { IncomeSource } from "../Processing/Models/IncomeSource";
import { Group } from "./Items/Group";
import { Debt } from "../Processing/Models/Debt";
import { Bill } from "../Processing/Models/Bill";
import { ValueItem } from "./Items/ValueItem";
import { BottomTabs } from "./BottomTabs";
import { Divider } from "./UIElements/Divider";
import { Investment } from "../Processing/Models/Investment";
import { autobind } from "../Utilities/Decorators";
import { InvestmentItem } from "./Items/InvestmentItem";
import { PaymentSchedule } from "../Processing/Models/ScheduledPayment";
import { ScheduledPaymentItem } from "./Items/ScheduledPaymentItem";
import { VestSchedule } from "../Processing/Models/VestSchedule";
import { ScheduledVestItem } from "./Items/ScheduledVestItem";
import { TellerManager } from "../Processing/Managers/TellerManager";
import { LinkedAccountDetails } from "../APIs/TellerAPI";
import { LinkedAccountItem } from "./Items/LinkedAccountItem";
import { LinkedAccountGroup } from "./Items/LinkedAccountGroup";
import { Modeler } from "./Modeler";

export enum ContentTab {
  Costs = "costs",
  Reserves = "reserves",
  Schedules = "schedules",
  Modeler = "modeler"
}

interface ContentAreaState {
  groups?: GroupsData;
  accounts?: Account[];
  incomeSources?: IncomeSource[];
  debts?: Debt[];
  bills?: Bill[];
  investments?: Investment[];
  paymentSchedules?: PaymentSchedule[];
  vestSchedules?: VestSchedule[];
  linkedAccounts?: LinkedAccountDetails[];
  tab: ContentTab;
}

export class ContentArea extends React.Component<{}, ContentAreaState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      groups: GroupManager.groups,
      accounts: [...AppStateManager.accounts],
      incomeSources: [...AppStateManager.incomeSources],
      investments: [...AppStateManager.investments],
      paymentSchedules: [...AppStateManager.paymentSchedules],
      vestSchedules: [...AppStateManager.vestSchedules],
      tab: ContentTab.Costs
    }
  }

  componentDidMount() {
    GroupManager.ongroupsupdated.addListener(this.handleGroupsUpdated);
    AppStateManager.onaccountsupdated.addListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.addListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.addListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.addListener(this.handleBillsUpdated);
    AppStateManager.oninvestmentsupdated.addListener(this.handleInvestmentsUpdated);
    AppStateManager.onpaymentschedulesupdated.addListener(this.handlePaymentSchedulesUpdated);
    AppStateManager.onvestschedulesupdated.addListener(this.handleVestSchedulesUpdated);
    TellerManager.onlinkedaccountsupdated.addListener(this.handleLinkedAccountsUpdated);
  }

  componentWillUnmount() {
    GroupManager.ongroupsupdated.removeListener(this.handleGroupsUpdated);
    AppStateManager.onaccountsupdated.removeListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.removeListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.removeListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.removeListener(this.handleBillsUpdated);
    AppStateManager.oninvestmentsupdated.removeListener(this.handleInvestmentsUpdated);
    AppStateManager.onpaymentschedulesupdated.removeListener(this.handlePaymentSchedulesUpdated);
    AppStateManager.onvestschedulesupdated.removeListener(this.handleVestSchedulesUpdated);
    TellerManager.onlinkedaccountsupdated.removeListener(this.handleLinkedAccountsUpdated);
  }

  @autobind
  private handleLinkedAccountsUpdated(data: LinkedAccountDetails[]) {
    this.setState({
      linkedAccounts: data
    });
  }

  @autobind
  private handleGroupsUpdated(data: GroupsData) {
    this.setState({
      groups: data
    });
  }

  @autobind
  private handleVestSchedulesUpdated(data: Iterable<VestSchedule>) {
    this.setState({
      vestSchedules: [...data]
    })
  }

  @autobind
  private handlePaymentSchedulesUpdated(data: Iterable<PaymentSchedule>) {
    this.setState({
      paymentSchedules: [...data]
    });
  }

  @autobind
  private handleBillsUpdated(bills: Iterable<Bill>) {
    this.setState({
      bills: [...bills]
    });
  }

  @autobind
  private handleAccountsUpdated(accounts: Iterable<Account>) {
    this.setState({
      accounts: [...accounts]
    });
  }

  @autobind
  private handleIncomeSourcesUpdated(sources: Iterable<IncomeSource>) {
    this.setState({
      incomeSources: [...sources]
    });
  }

  @autobind
  private handleDebtsUpdated(debts: Iterable<Debt>) {
    this.setState({
      debts: [...debts]
    });
  }

  @autobind
  private handleInvestmentsUpdated(investments: Iterable<Investment>) {
    this.setState({
      investments: [...investments]
    });
  }

  private handleTabChanged(tab: ContentTab) {
    this.setState({
      tab: tab
    });
  }

  private renderGroups(): JSX.Element[] {
    const result: JSX.Element[] = [];
    if (this.state.groups) {
      let billsGroups = this.state.groups.billGroups;
      let debtGroups = this.state.groups.debtGroups;
      for (let [name, ids] of billsGroups) {
        result.push(
          <Group
            key={`bill_group_${name}`}
            name={name}
            items={ids}
            type={GroupType.Bill}
          />
        );
      }
      for (let [name, ids] of debtGroups) {
        result.push(
          <Group
            key={`debt_group_${name}`}
            name={name}
            items={ids}
            type={GroupType.Debt}
          />
        );
      }
      if (this.state.linkedAccounts) {
        const creditItems = this.state.linkedAccounts.filter(item => item.type === "credit");
        if (creditItems.length > 0) {
          result.push(
            <LinkedAccountGroup key="linked_group" accounts={creditItems} name="Linked Cards" />
          )
        }
      }
    }
    return result;
  }

  private renderAccounts() {
    const result: JSX.Element[] = [];
    if (this.state.accounts) {
      for (let account of this.state.accounts) {
        result.push(
          <ValueItem
            item={account}
            key={account.id}
          />
        );
      }
    }
    if (this.state.linkedAccounts) {
      for (let account of this.state.linkedAccounts) {
        if (account.type === "depository") {
          result.push(
            <LinkedAccountItem account={account} key={account.id} />
          );
        }
      }
    }
    return result;
  }

  private renderIncomeSources() {
    const result: JSX.Element[] = [];
    if (this.state.incomeSources) {
      for (let source of this.state.incomeSources) {
        result.push(
          <ValueItem
            item={source}
            key={source.id}
          />
        );
      }
    }
    return result;
  }

  private renderInvestments() {
    const result: JSX.Element[] = [];
    if (this.state.investments) {
      for (let investment of this.state.investments) {
        result.push(
          <InvestmentItem item={investment} key={investment.id} />
        );
      }
    }
    return result;
  }

  private renderUngroupedArea() {
    let sections: JSX.Element[] = [];
    if (this.state.accounts?.length || this.state.linkedAccounts?.length) {
      sections.push(
        <div className={contentStyles['ungrouped-section']} key="account_section">
          {this.renderAccounts()}
        </div>
      );
    }
    if (this.state.incomeSources?.length) {
      sections.push(
        <div className={contentStyles['ungrouped-section']} key="income_section">
          {this.renderIncomeSources()}
        </div>
      );
    }
    if (this.state.investments?.length) {
      sections.push(
        <div className={contentStyles['ungrouped-section']} key="invest_section">
          {this.renderInvestments()}
        </div>
      );
    }
    let components: JSX.Element[] = [];
    for (let i = 0; i < sections.length; i++) {
      if (i === 0) {
        components.push(sections[i]);
      } else {
        components.push(<Divider key={`divider_${i}`} />);
        components.push(sections[i]);
      }
    }
    return components;
  }

  @autobind
  private renderPaymentSchedule(schedule: PaymentSchedule) {
    return <ScheduledPaymentItem schedule={schedule} key={schedule.id} />
  }

  @autobind renderVestSchedule(schedule: VestSchedule) {
    return <ScheduledVestItem schedule={schedule} key={schedule.id} />
  }

  private renderSchedules() {
    return (
      <>
        <div className={contentStyles['ungrouped-section']}>
          {this.state.paymentSchedules?.map(this.renderPaymentSchedule)}
        </div>
        <div className={contentStyles['ungrouped-section']}>
          {this.state.vestSchedules?.map(this.renderVestSchedule)}
        </div>
      </>
    )
  }

  render() {
    return (
      <>
        <Row className={contentStyles['content-area-body']}>
          <Container fluid className={contentStyles['content-container']}>
            <Row className={contentStyles['content-row']}>
              <Col
                className={[
                  contentStyles['content-col'],
                  contentStyles['grouped'],
                  this.state.tab === ContentTab.Costs ? '' : mobileStyles["desktop-only"]
                ].join(" ")}
              >
                {this.renderGroups()}
              </Col>
              <Col xs sm={2}
                className={[
                  contentStyles['content-col'],
                  contentStyles['ungrouped'],
                  this.state.tab === ContentTab.Reserves ? '' : mobileStyles["desktop-only"]
                ].join(" ")
                }>
                {this.renderUngroupedArea()}
              </Col>
              <Col xs sm={2} md={3}
                className={[
                  contentStyles['content-col'],
                  contentStyles['ungrouped'],
                  this.state.tab === ContentTab.Schedules ? '' : mobileStyles["desktop-only"]
                ].join(" ")
                }>
                {this.renderSchedules()}
              </Col>
              <Col xs sm={2} md={3}
                className={[
                  contentStyles['content-col'],
                  contentStyles['ungrouped'],
                  mobileStyles["mobile-only"],
                  this.state.tab === ContentTab.Modeler ? '' : contentStyles["hidden"]
                ].join(" ")
                }>
                {<Modeler visible={this.state.tab === ContentTab.Modeler}/>}
              </Col>
            </Row>
          </Container>
        </Row>
        <BottomTabs
          onChange={(tab) => this.handleTabChanged(tab)}
          currentTab={this.state.tab}
          className={[mobileStyles["mobile-only"], contentStyles["reverse-padding"]].join(" ")}
        />
      </>
    )
  }
}