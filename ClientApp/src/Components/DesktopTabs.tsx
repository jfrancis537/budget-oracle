import React from "react";
import { Navbar, Nav } from "react-bootstrap";

interface IDesktopTabProps<T> {
  currentTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

abstract class DesktopTabs<T extends string> extends React.Component<IDesktopTabProps<T>> {

  protected handleChange(tab: T) {
    if (tab !== this.props.currentTab) {
      this.props.onChange(tab);
    }
  }

  protected abstract renderNavItems(): JSX.Element;

  public render() {
    return (
      <Navbar bg='dark' variant="dark" className={this.props.className}>
        <Nav variant="pills" justify activeKey={this.props.currentTab} style={{ flex: 1 }}>
          {this.renderNavItems()}
        </Nav>
      </Navbar>
    )
  }
}


export enum LeftContentTab {
  Costs = 'costs',
  Investments = 'investments',
  Reports = 'reports'
}

export class LeftTabs extends DesktopTabs<LeftContentTab> {
  protected renderNavItems(): JSX.Element {
    return (
      <>
        <Nav.Item>
          <Nav.Link
            onClick={() => this.handleChange(LeftContentTab.Costs)}
            eventKey={LeftContentTab.Costs}
          >
            <span style={{ color: '#f66c6c' }}>
              <i className="bi bi-cash-coin" />
            </span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={() => this.handleChange(LeftContentTab.Reports)}
            eventKey={LeftContentTab.Reports}
          >
            <span style={{ color: 'rgb(74 196 255)' }}>
              <i className="bi bi-receipt-cutoff" />
            </span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={() => this.handleChange(LeftContentTab.Investments)}
            eventKey={LeftContentTab.Investments}
          >
            <span style={{ color: '#71fe75' }}>
              <i className="bi bi-graph-up" />
            </span>
          </Nav.Link>
        </Nav.Item>
      </>
    )
  }

}

export enum RightContentTab {
  Holdings = 'holdings',
  Modeler = 'modeler'
}

export class RightTabs extends DesktopTabs<RightContentTab> {
  protected renderNavItems(): JSX.Element {
    return (
      <>
        <Nav.Item>
          <Nav.Link
            onClick={() => this.handleChange(RightContentTab.Holdings)}
            eventKey={RightContentTab.Holdings}
          >
            <span style={{ color: '#71fe75' }}>
              <i className="bi bi-bank" />
            </span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={() => this.handleChange(RightContentTab.Modeler)}
            eventKey={RightContentTab.Modeler}
          >
            <span style={{ color: 'rgb(74 196 255)' }}>
              <i className="bi bi-bar-chart-line" />
            </span>
          </Nav.Link>
        </Nav.Item>
      </>
    )
  }

}