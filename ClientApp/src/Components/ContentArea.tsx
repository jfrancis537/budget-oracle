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
import { Content } from "react-bootstrap/lib/Tab";

export enum ContentTab {
  BillsAndDebts = "bd",
  AccountsAndIncome = "ai"
}

interface ContentAreaState {
  groups?: GroupsData;
  accounts?: Account[];
  incomeSources?: IncomeSource[]
  debts?: Debt[]
  bills?: Bill[]
  tab: ContentTab
}

export class ContentArea extends React.Component<{}, ContentAreaState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      groups: GroupManager.groups,
      accounts: [...AppStateManager.accounts],
      incomeSources: [...AppStateManager.incomeSources],
      tab: ContentTab.BillsAndDebts
    }

    this.handleGroupsUpdated = this.handleGroupsUpdated.bind(this);
    this.handleAccountsUpdated = this.handleAccountsUpdated.bind(this);
    this.handleIncomeSourcesUpdated = this.handleIncomeSourcesUpdated.bind(this);
    this.handleBillsUpdated = this.handleBillsUpdated.bind(this);
    this.handleDebtsUpdated = this.handleDebtsUpdated.bind(this);
  }

  componentDidMount() {
    GroupManager.ongroupsupdated.addListener(this.handleGroupsUpdated);
    AppStateManager.onaccountsupdated.addListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.addListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.addListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.addListener(this.handleBillsUpdated);
  }

  componentWillUnmount() {
    GroupManager.ongroupsupdated.removeListener(this.handleGroupsUpdated);
    AppStateManager.onaccountsupdated.removeListener(this.handleAccountsUpdated);
    AppStateManager.onincomesourcesupdated.removeListener(this.handleIncomeSourcesUpdated);
    AppStateManager.ondebtsupdated.removeListener(this.handleDebtsUpdated);
    AppStateManager.onbillsupdated.removeListener(this.handleBillsUpdated);
  }

  private handleGroupsUpdated(data: GroupsData) {
    this.setState({
      groups: data
    });
  }

  private handleBillsUpdated(bills: Iterable<Bill>) {
    this.setState({
      bills: [...AppStateManager.bills]
    });
  }

  private handleAccountsUpdated(accounts: Iterable<Account>) {
    this.setState({
      accounts: [...accounts]
    });
  }

  private handleIncomeSourcesUpdated(sources: Iterable<IncomeSource>) {
    this.setState({
      incomeSources: [...sources]
    });
  }

  private handleDebtsUpdated(debts: Iterable<Debt>) {
    this.setState({
      debts: [...debts]
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

  render() {

    //Using a mobile device probably
    let smallClass = "";
    // if (window.visualViewport.width <= 576) {
    //   smallClass = contentStyles['content-col-sm'];
    // }

    return (
      <>
        <Row className={contentStyles['content-area-body']}>
          <Container fluid className={contentStyles['content-container']}>
            <Row className={contentStyles['content-row']}>
              <Col
                className={[
                  contentStyles['content-col'],
                  contentStyles['grouped'],
                  smallClass,
                  this.state.tab === ContentTab.BillsAndDebts ? '' : mobileStyles["desktop-only"]
                ].join(" ")}
                >
                {this.renderGroups()}
              </Col>
              <Col xs sm={3}
                className={[
                  contentStyles['content-col'],
                  contentStyles['ungrouped'],
                  smallClass,
                  this.state.tab === ContentTab.AccountsAndIncome ? '' : mobileStyles["desktop-only"]
                ].join(" ")
                }>
                <div className={contentStyles['ungrouped-section']}>
                  {this.renderAccounts()}
                </div>
                <div className={contentStyles['ungrouped-section']}>
                  {this.renderIncomeSources()}
                </div>
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