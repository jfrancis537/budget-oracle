import React from "react";
import { Nav, Navbar } from "react-bootstrap";

export enum MobileContentTab {
  Costs = "costs",
  Reserves = "reserves",
  Schedules = "schedules",
  Modeler = "modeler",
  Investments = 'investments',
  Reports = 'reports'
}

interface IMobileTabProps {
  currentTab: MobileContentTab;
  onChange: (tab: MobileContentTab) => void;
  className?: string;
}

export class MobileTabs extends React.Component<IMobileTabProps> {

  private handleChange(tab: MobileContentTab) {
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
              onClick={() => this.handleChange(MobileContentTab.Costs)}
              eventKey={MobileContentTab.Costs}
            >
              <span style={{ color: '#f66c6c' }}>
                <i className="bi bi-receipt" />
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(MobileContentTab.Reports)}
              eventKey={MobileContentTab.Reports}
            >
              <span style={{ color: 'rgb(74 196 255)' }}>
                <i className="bi bi-receipt-cutoff" />
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(MobileContentTab.Investments)}
              eventKey={MobileContentTab.Investments}
            >
              <span style={{ color: '#71fe75' }}>
                <i className="bi bi-graph-up" />
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(MobileContentTab.Reserves)}
              eventKey={MobileContentTab.Reserves}
            >
              <span style={{ color: '#71fe75' }}>
                <i className="bi bi-bank" />
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(MobileContentTab.Schedules)}
              eventKey={MobileContentTab.Schedules}
            >
              <span style={{ color: '#71fe75' }}>
                <i className="bi bi-calendar-check" />
              </span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              onClick={() => this.handleChange(MobileContentTab.Modeler)}
              eventKey={MobileContentTab.Modeler}
            >
              <span style={{ color: 'rgb(74 196 255)' }}>
                <i className="bi bi-bar-chart-line" />
              </span>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar>
    )
  }
}