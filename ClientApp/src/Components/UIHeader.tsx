import React from "react";
import { Row, Nav, Navbar, NavDropdown, InputGroup } from "react-bootstrap";
import { AppStateManager } from "../Processing/Managers/AppStateManager";
import { GroupManager } from "../Processing/Managers/GroupManager";
import { PromptManager } from "../Processing/Managers/PromptManager";
import { DatePicker } from "./Inputs/DatePicker";
import navStyles from '../styles/Nav.module.css';
import { CalculationsManager } from "../Processing/Managers/CalculationsManager";
import { download, FileLoader } from "../Utilities/FileUtils";
import { UserManager } from "../Processing/Managers/UserManager";
import { LoginPrompt } from "./Prompts/LoginPrompt";
import { autobind } from "../Utilities/Decorators";
import { PushNotificationWorker } from "../Workers/ServiceWorkerLoader";

interface IUIHeaderState {
  loginPromptVisible: boolean;
  userLoggedIn: boolean;
  isSubscribed?: boolean;
}

export class UIHeader extends React.Component<{}, IUIHeaderState> {

  private notificationWorker?: PushNotificationWorker;

  constructor(props: {}) {
    super(props);
    this.state = {
      loginPromptVisible: false,
      userLoggedIn: false
    }
  }

  componentDidMount() {
    UserManager.onuserloggedin.addListener(this.handleUserLoggedIn);
    UserManager.onuserloggedout.addListener(this.handleUserLoggedOut);
  }

  @autobind
  private async handleUserLoggedIn() {
    this.setState({ userLoggedIn: true });
    this.notificationWorker = new PushNotificationWorker("/workers/PushNotificationWorker.js");
    await this.notificationWorker.isReady;

    this.setState({
      isSubscribed: await this.notificationWorker.isSubscribed
    });
  }

  @autobind
  private handleUserLoggedOut() {
    this.setState({ userLoggedIn: false });
    this.notificationWorker = undefined;
  }

  @autobind
  private addGroup() {
    PromptManager.requestGroupPrompt({
      editing: false,
    });
  }

  @autobind
  private addIncomeSource() {
    PromptManager.requestIncomePrompt({
      editing: false
    });
  }

  @autobind
  private addAccount() {
    PromptManager.requestAccountPrompt({
      editing: false,
    });
  }

  @autobind
  private addInvestment() {
    PromptManager.requestInvestmentPrompt({
      editing: false
    });
  }

  @autobind
  private addPaymentSchedule() {
    PromptManager.requestPaymentSchedulePrompt({
      editing: false,
      viewOnly: false
    });
  }

  @autobind
  private addStockVestSchedule() {
    PromptManager.requestVestSchedulePrompt({
      editing: false,
      viewOnly: false
    });
  }

  @autobind
  private async export() {
    let promises = [
      AppStateManager.export(),
      GroupManager.export()
    ];
    let [stateData, groupData] = await Promise.all(promises);
    if (groupData && stateData) {
      download(`budget_export_${(new Date()).toLocaleString().replace(", ", "-")}.json`, JSON.stringify({
        stateData: stateData,
        groupData: groupData
      }));
    }
  }

  @autobind
  private closeLoginPrompt() {
    this.setState({
      loginPromptVisible: false
    });
  }

  @autobind
  private async import() {
    try {
      let file = await FileLoader.openWithDialog();
      let text = await FileLoader.readAsText(file);
      let obj: { stateData: string, groupData: string } = JSON.parse(text);
      await AppStateManager.import(obj.stateData);
      await GroupManager.import(obj.groupData);
    } catch (errCode) {
      if ((errCode as number) < 0) {
        alert('Something went wrong');
      }
    }
  }

  @autobind
  private async reset() {
    var doIt = window.confirm("Are you sure you want to reset?");
    if (doIt) {
      let promises = [
        AppStateManager.reset(),
        GroupManager.reset()
      ];
      await Promise.all(promises);
    }
  }

  private renderLoginControl() {
    if (!this.state.userLoggedIn) {
      return <Nav.Link onClick={this.login}>Login</Nav.Link>
    } else {
      return <Nav.Link onClick={this.logout}>Logout</Nav.Link>
    }
  }

  @autobind
  private login() {
    this.setState({
      loginPromptVisible: true
    });
  }

  @autobind
  private logout() {
    if (window.confirm("Do you want to sign out?")) {
      UserManager.logout();
    }
  }

  @autobind
  private async handleToggleSubscription() {
    if (this.state.isSubscribed) {
      let result = !!(await this.notificationWorker?.unsubscribe());
      if (result) {
        this.setState({
          isSubscribed: false
        });
      }
    } else {
      let result = !!(await this.notificationWorker?.subscribe());
      if (result) {
        this.setState({
          isSubscribed: true
        });
      }
    }
  }

  private renderSettings() {
    if (!this.state.userLoggedIn) {
      return null;
    } else {
      return (
        <NavDropdown title="Settings" id='settings_dropdown'>
          <NavDropdown.Header>Notifications</NavDropdown.Header>
          <NavDropdown.Item disabled={this.state.isSubscribed === undefined} onClick={this.handleToggleSubscription}>{this.state.isSubscribed ? "Unsubscribe" : "Subscribe"}</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item disabled onClick={() => { }}>Reset Password</NavDropdown.Item>
        </NavDropdown>
      )
    }
  }

  render() {
    return (
      <>
        <Row>
          <Navbar collapseOnSelect bg="dark" expand='xl' variant='dark' className={navStyles['navbar']}>
            <Navbar.Brand>Budget Oracle</Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse>
              <Nav>
                <NavDropdown title="Add" id='add_dropdown'>
                  <NavDropdown.Item onClick={this.addAccount}>Account</NavDropdown.Item>
                  <NavDropdown.Item onClick={this.addIncomeSource}>Income</NavDropdown.Item>
                  <NavDropdown.Item disabled={!UserManager.isLoggedIn} onClick={this.addInvestment}>Investment</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={this.addGroup}>Group</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={this.addPaymentSchedule}>Payment Schedule</NavDropdown.Item>
                  <NavDropdown.Item onClick={this.addStockVestSchedule}>Stock Vest Schedule</NavDropdown.Item>
                </NavDropdown>
                {this.renderSettings()}
                <NavDropdown title="Tools" id='tools_dropdown'>
                  <NavDropdown.Item onClick={this.import}>Import</NavDropdown.Item>
                  <NavDropdown.Item onClick={this.export}>Export</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => window.location.reload()}>Refresh</NavDropdown.Item>
                  <NavDropdown.Item disabled={this.state.userLoggedIn} onClick={this.reset}>Reset</NavDropdown.Item>
                </NavDropdown>
                {this.renderLoginControl()}
              </Nav>
            </Navbar.Collapse>
            <Navbar.Collapse className={navStyles['right-collapse']}>
              <InputGroup className={navStyles['right-collapse']}>
                <DatePicker
                  defaultDate={CalculationsManager.instance.endDate}
                  inputProps={{
                    "aria-label": 'date-picker',
                    className: navStyles['date-picker']
                  }}
                  onChange={(date) => {
                    CalculationsManager.instance.endDate = date;
                  }}
                />
              </InputGroup>
            </Navbar.Collapse>
          </Navbar>
        </Row>
        <LoginPrompt isOpen={this.state.loginPromptVisible} onClose={() => this.closeLoginPrompt()} />
      </>
    )
  }
}