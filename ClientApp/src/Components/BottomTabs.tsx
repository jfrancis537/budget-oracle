import React from "react";
import { Nav, Navbar } from "react-bootstrap";
import { ContentTab } from "./ContentArea";

interface IBottomTabProps {
  currentTab: ContentTab;
  onChange: (tab: ContentTab) => void;
  className?: string;
}

export class BottomTabs extends React.Component<IBottomTabProps> {

  private handleChange(tab: ContentTab) {
    if (tab !== this.props.currentTab) {
      this.props.onChange(tab);
    }
  }

  public render() {
    return (
      <Navbar bg='dark' variant="dark" className={this.props.className}>
        <Nav variant="pills" justify activeKey={this.props.currentTab} style={{ flex: 1 }}>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(ContentTab.Costs)}
              eventKey={ContentTab.Costs}
            >
              Bills / Debts
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(ContentTab.Reserves)}
              eventKey={ContentTab.Reserves}
            >
              Income / Accounts
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    )
  }
}