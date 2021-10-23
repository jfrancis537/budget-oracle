import React from "react";
import { DOMUtils } from "../Utilities/DOMUtils";

interface ILinkButtonProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {

}

export class LinkButton extends React.Component<ILinkButtonProps> {

  private anchorRef: React.RefObject<HTMLAnchorElement>;

  constructor(props: ILinkButtonProps) {
    super(props);
    this.anchorRef = React.createRef();
  }

  componentDidMount() {
    if (!this.props.href && this.anchorRef.current) {
      DOMUtils.removeAnchorNavigation(this.anchorRef.current);
    }
  }

  render() {
    return (
      <a ref={this.anchorRef} {...this.props}>{this.props.children}</a>
    )
  }
}