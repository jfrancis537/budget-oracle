import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Account } from "../Processing/Models/Account";
import { AppStateManager } from "../Processing/Managers/AppStateManager";
import { GroupManager, GroupsData } from "../Processing/Managers/GroupManager";
import { IncomeSource } from "../Processing/Models/IncomeSource";
import { CostGroup, InvestmentGroup } from "./Items/Group";
import { Debt } from "../Processing/Models/Debt";
import { Bill } from "../Processing/Models/Bill";
import { ValueItem } from "./Items/ValueItem";
import { MobileContentTab, MobileTabs } from "./MobileTabs";
import { Divider } from "./UIElements/Divider";
import { Investment } from "../Processing/Models/Investment";
import { autobind } from "../Utilities/Decorators";
import { PaymentSchedule } from "../Processing/Models/ScheduledPayment";
import { ScheduledPaymentItem } from "./Items/ScheduledPaymentItem";
import { VestSchedule } from "../Processing/Models/VestSchedule";
import { ScheduledVestItem } from "./Items/ScheduledVestItem";
import { TellerManager } from "../Processing/Managers/TellerManager";
import { LinkedAccountDetails } from "../APIs/TellerAPI";
import { LinkedAccountItem } from "./Items/LinkedAccountItem";
import { LinkedAccountGroup } from "./Items/LinkedAccountGroup";
import { Modeler } from "./Modeler";
import { LeftContentTab, LeftTabs, RightContentTab, RightTabs } from "./DesktopTabs";
import { InvestmentGroupData, InvestmentGroupManager } from "../Processing/Managers/InvestmentGroupManager";
import { GroupType } from "../Processing/Enums/GroupType";

import contentStyles from '../styles/ContentArea.module.css';
import mobileStyles from '../styles/MobileHelper.module.css';
import tabStyles from '../styles/DesktopTabs.module.css';
import groupStyles from '../styles/Group.module.css';
import { TransactionArea } from "./TransactionArea";

interface ContentAreaState {
  costGroups?: GroupsData;
  investmentGroups?: InvestmentGroupData;
  accounts?: Account[];
  incomeSources?: IncomeSource[];
  debts?: Debt[];
  bills?: Bill[];
  investments?: Investment[];
  paymentSchedules?: PaymentSchedule[];
  vestSchedules?: VestSchedule[];
  linkedAccounts?: LinkedAccountDetails[];
  mobileTab: MobileContentTab;
  leftTab: LeftContentTab;
  rightTab: RightContentTab;
}

export class ContentArea extends React.Component<{}, ContentAreaState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      costGroups: GroupManager.groups,
      investmentGroups: InvestmentGroupManager.groups,
      accounts: [...AppStateManager.accounts],
      incomeSources: [...AppStateManager.incomeSources],
      investments: [...AppStateManager.investments],
      paymentSchedules: [...AppStateManager.paymentSchedules],
      vestSchedules: [...AppStateManager.vestSchedules],
      mobileTab: MobileContentTab.Costs,
      leftTab: LeftContentTab.Costs,
      rightTab: RightContentTab.Holdings
    }
  }

  componentDidMount() {
    GroupManager.ongroupsupdated.addListener(this.handleGroupsUpdated);
    InvestmentGroupManager.ongroupsupdated.addListener(this.handleInvestmentGroupsUpdated);
    AppStateManager.onaccountsupdated.addListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.addListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.addListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.addListener(this.handleBillsUpdated);
    AppStateManager.oninvestmentsupdated.addListener(this.handleInvestmentsUpdated);
    AppStateManager.onpaymentschedulesupdated.addListener(this.handlePaymentSchedulesUpdated);
    AppStateManager.onvestschedulesupdated.addListener(this.handleVestSchedulesUpdated);
    TellerManager.onlinkedaccountsupdated.addListener(this.handleLinkedAccountsUpdated);
    TellerManager.oncategorynamesupdated.addListener(this.handleCategoryNamesUpdated);
  }

  componentWillUnmount() {
    GroupManager.ongroupsupdated.removeListener(this.handleGroupsUpdated);
    InvestmentGroupManager.ongroupsupdated.removeListener(this.handleInvestmentGroupsUpdated)
    AppStateManager.onaccountsupdated.removeListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.removeListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.removeListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.removeListener(this.handleBillsUpdated);
    AppStateManager.oninvestmentsupdated.removeListener(this.handleInvestmentsUpdated);
    AppStateManager.onpaymentschedulesupdated.removeListener(this.handlePaymentSchedulesUpdated);
    AppStateManager.onvestschedulesupdated.removeListener(this.handleVestSchedulesUpdated);
    TellerManager.onlinkedaccountsupdated.removeListener(this.handleLinkedAccountsUpdated);
    TellerManager.oncategorynamesupdated.removeListener(this.handleCategoryNamesUpdated);

  }

  @autobind
  private handleLinkedAccountsUpdated(data: LinkedAccountDetails[]) {
    this.setState({
      linkedAccounts: data
    });
  }

  @autobind 
 private handleCategoryNamesUpdated() {
  this.forceUpdate()
  }

  @autobind
  private handleGroupsUpdated(data: GroupsData) {
    this.setState({
      costGroups: data
    });
  }

  @autobind
  private handleInvestmentGroupsUpdated(data: InvestmentGroupData) {
    this.setState({
      investmentGroups: data
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

  @autobind
  private handleMobileTabChanged(tab: MobileContentTab) {
    this.setState({
      mobileTab: tab
    });
  }

  @autobind
  private handleLeftTabChanged(tab: LeftContentTab) {
    this.setState({
      leftTab: tab
    });
  }

  @autobind
  private handleRightTabChanged(tab: RightContentTab) {
    this.setState({
      rightTab: tab
    });
  }

  private renderGroups(): JSX.Element[] {
    const result: JSX.Element[] = [];
    if (this.state.costGroups) {
      let billsGroups = this.state.costGroups.billGroups;
      let debtGroups = this.state.costGroups.debtGroups;
      for (let [name, ids] of billsGroups) {
        result.push(
          <CostGroup
            key={`bill_group_${name}`}
            name={name}
            items={ids}
            type={GroupType.Bill}
          />
        );
      }
      for (let [name, ids] of debtGroups) {
        result.push(
          <CostGroup
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

  private renderInvestmentGroups(): JSX.Element[] {
    const result: JSX.Element[] = [];
    if (this.state.investmentGroups) {
      for (let [name, ids] of this.state.investmentGroups) {
        result.push(
          <InvestmentGroup
            key={`investment_group_${name}`}
            name={name}
            items={ids}
          />
        );
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

  private renderMobile() {
    return (
      <Row className={`${contentStyles['content-row']} ${mobileStyles['mobile-only']}`}>
        <Col
          className={[
            contentStyles['content-col'],
            groupStyles['grid'],
            contentStyles['grouped'],
            this.state.mobileTab === MobileContentTab.Costs ? '' : contentStyles["hidden"]
          ].join(" ")}
        >
          {this.renderGroups()}
        </Col>
        <Col
          className={[
            contentStyles['content-col'],
            groupStyles['grid'],
            contentStyles['grouped'],
            this.state.mobileTab === MobileContentTab.Investments ? '' : contentStyles["hidden"]
          ].join(" ")}
        >
          {this.renderInvestmentGroups()}
        </Col>
        <Col
          className={[
            contentStyles['content-col'],
            contentStyles['grouped'],
            this.state.mobileTab === MobileContentTab.Reports ? '' : contentStyles["hidden"]
          ].join(" ")}
        >
          <TransactionArea />
        </Col>
        <Col xs sm={2}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            this.state.mobileTab === MobileContentTab.Reserves ? '' : contentStyles["hidden"]
          ].join(" ")
          }>
          {this.renderUngroupedArea()}
        </Col>
        <Col xs sm={2} md={3}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            this.state.mobileTab === MobileContentTab.Schedules ? '' : contentStyles["hidden"]
          ].join(" ")
          }>
          {this.renderSchedules()}
        </Col>
        <Col xs sm={2} md={3}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            mobileStyles["mobile-only"],
            this.state.mobileTab === MobileContentTab.Modeler ? '' : contentStyles["hidden"]
          ].join(" ")
          }>
          {<Modeler visible={this.state.mobileTab === MobileContentTab.Modeler} />}
        </Col>
      </Row>
    )
  }

  private renderDesktop() {
    return (
      <Row className={`${contentStyles['content-row']} ${mobileStyles['desktop-only']}`}>
        <Col
          className={[
            contentStyles['content-col'],
            groupStyles['grid'],
            contentStyles['grouped'],
            this.state.leftTab === LeftContentTab.Costs ? '' : contentStyles['hidden']
          ].join(" ")}
        >
          {this.renderGroups()}
        </Col>
        <Col
          className={[
            contentStyles['content-col'],
            groupStyles['grid'],
            contentStyles['grouped'],
            this.state.leftTab === LeftContentTab.Investments ? '' : contentStyles['hidden']
          ].join(" ")}
        >
          {this.renderInvestmentGroups()}
        </Col>
        <Col
          className={[
            contentStyles['content-col'],
            contentStyles['grouped'],
            this.state.leftTab === LeftContentTab.Reports ? '' : contentStyles['hidden']
          ].join(" ")}
        >
          <TransactionArea />
        </Col>
        <Col xs sm={2}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            this.state.rightTab === RightContentTab.Holdings ? '' : contentStyles['hidden']
          ].join(" ")
          }>
          {this.renderUngroupedArea()}
        </Col>
        <Col xs sm={2} md={3}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            this.state.rightTab === RightContentTab.Holdings ? '' : contentStyles['hidden']
          ].join(" ")
          }>
          {this.renderSchedules()}
        </Col>
        <Col xs sm={4} md={5}
          className={[
            contentStyles['content-col'],
            contentStyles['ungrouped'],
            this.state.rightTab === RightContentTab.Modeler ? '' : contentStyles['hidden']
          ].join(" ")
          }>
          {<Modeler visible={this.state.rightTab === RightContentTab.Modeler} />}
        </Col>
      </Row>
    )
  }

  render() {
    return (
      <>
        <Row className={contentStyles['content-area-body']}>
          <Container fluid className={contentStyles['content-container']}>
            {this.renderMobile()}
            {this.renderDesktop()}
            <Row className={`${mobileStyles["desktop-only"]} ${tabStyles['row']}`}>
              <Col className={`${tabStyles['col']} ${tabStyles['left']}`}>
                <LeftTabs onChange={this.handleLeftTabChanged} currentTab={this.state.leftTab} />
              </Col>
              <Col xs sm={4} md={5} className={`${tabStyles['col']} ${tabStyles['right']}`}>
                <RightTabs onChange={this.handleRightTabChanged} currentTab={this.state.rightTab} />
              </Col>
            </Row>
          </Container>
        </Row>
        <MobileTabs
          onChange={this.handleMobileTabChanged}
          currentTab={this.state.mobileTab}
          className={[mobileStyles["mobile-only"], contentStyles["reverse-padding"]].join(" ")}
        />
      </>
    )
  }
}