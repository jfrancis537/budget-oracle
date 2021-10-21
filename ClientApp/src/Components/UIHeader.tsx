import React from "react";
import { Row, Nav, Navbar, NavDropdown, InputGroup } from "react-bootstrap";
import { AppStateManager } from "../Processing/Managers/AppStateManager";
import { GroupManager } from "../Processing/Managers/GroupManager";
import { PromptManager } from "../Processing/Managers/PromptManager";
import { DatePicker } from "./Inputs/DatePicker";
import navStyles from '../styles/Nav.module.css';
import { CalculationsManager } from "../Processing/Managers/CalculationsManager";

export class UIHeader extends React.Component {

  constructor(props: {}) {
    super(props);

    this.state = {
      activePrompt: undefined
    }

    this.addGroup = this.addGroup.bind(this);
    this.addIncomeSource = this.addIncomeSource.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.export = this.export.bind(this);
    this.reset = this.reset.bind(this);
  }

  private addGroup() {
    PromptManager.requestGroupPrompt({
      editing: false,
    });
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

  private export() {
    AppStateManager.export();
  }

  private reset() {
    var doIt = window.confirm("Are you sure you want to reset?");
    if (doIt) {
      AppStateManager.reset();
      GroupManager.reset();
    }
  }

  render() {
    return (
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
              <Nav.Link onClick={this.export}>Export</Nav.Link>
              <Nav.Link onClick={this.reset}>Reset</Nav.Link>
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
    )
  }
}