import React from "react";
import { Nav, Navbar } from "react-bootstrap";
import { autobind } from "../Utilities/Decorators";

interface ITabsProps<T extends string> {
  currentTab: T;
  onChange: (tab: T) => void;
  className?: string;
  options: Map<T, string>;
}

export class Tabs<T extends string> extends React.Component<ITabsProps<T>> {


  private handleChange(tab: T) {
    if (tab !== this.props.currentTab) {
      this.props.onChange(tab);
    }
  }

  @autobind
  private renderOption(kvp: [T, string]) {
    const [key, name] = kvp;
    return (
      <Nav.Item>
        <Nav.Link
          onClick={() => this.handleChange(key)}
          eventKey={key}
        >
          {name}
        </Nav.Link>
      </Nav.Item>
    );
  }

  public render() {
    return (
      <Navbar bg='dark' variant="dark" className={this.props.className}>
        <Nav variant="pills" justify activeKey={this.props.currentTab} style={{ flex: 1 }}>
          {[...this.props.options].map(this.renderOption)}
        </Nav>
      </Navbar>
    )
  }
}