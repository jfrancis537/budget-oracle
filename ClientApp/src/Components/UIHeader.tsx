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

interface IUIHeaderState {
  loginPromptVisible: boolean;
  userLoggedIn: boolean;
}

export class UIHeader extends React.Component<{}, IUIHeaderState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      loginPromptVisible: false,
      userLoggedIn: false
    }

    this.addGroup = this.addGroup.bind(this);
    this.addIncomeSource = this.addIncomeSource.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.updateStockApiKey = this.updateStockApiKey.bind(this);
    this.export = this.export.bind(this);
    this.import = this.import.bind(this);
    this.reset = this.reset.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.closeLoginPrompt = this.closeLoginPrompt.bind(this);
  }

  componentDidMount() {
    UserManager.onuserloggedin.addListener(() => this.setState({ userLoggedIn: true }));
    UserManager.onuserloggedout.addListener(() => this.setState({ userLoggedIn: false }));
  }

  private addGroup() {
    PromptManager.requestGroupPrompt({
      editing: false,
    });
  }

  private updateStockApiKey() {
    PromptManager.requestStockAPIKeyPrompt();
  }

  private addIncomeSource() {
    PromptManager.requestIncomePrompt({
      editing: false
    });
  }

  private addAccount() {
    PromptManager.requestAccountPrompt({
      editing: false,
    });
  }

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

  private closeLoginPrompt() {
    this.setState({
      loginPromptVisible: false
    });
  }

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

  private login() {
    this.setState({
      loginPromptVisible: true
    })
  }

  private logout() {
    UserManager.logout();
  }

  private renderSettings() {
    if (!this.state.userLoggedIn) {
      return null;
    } else {
      return (
        <NavDropdown title="Settings" id='settings_dropdown'>
          <NavDropdown.Item onClick={this.updateStockApiKey}>Set AlphaVantage™ API Key</NavDropdown.Item>
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
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={this.addGroup}>Group</NavDropdown.Item>
                </NavDropdown>
                {this.renderSettings()}
                <NavDropdown title="Tools" id='tools_dropdown'>
                  <NavDropdown.Item onClick={this.import}>Import</NavDropdown.Item>
                  <NavDropdown.Item onClick={this.export}>Export</NavDropdown.Item>
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