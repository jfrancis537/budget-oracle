import React from "react";
import { ButtonProps, Button, Spinner } from "react-bootstrap";

interface ILoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingText?: string;
}

export class LoadingButton extends React.Component<ILoadingButtonProps> {

  private renderLoading(): JSX.Element {
    return (
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
    );
  }

  public render() {
    let buttonProps = { ...this.props, isLoading: undefined, children: undefined };
    let children = this.props.children;
    const loadingText = this.props.loadingText ?? "Loading...";
    return (
      <Button {...buttonProps}>
        {this.props.isLoading && this.renderLoading()}
        {!this.props.isLoading ? children : loadingText}
      </Button>
    );
  }
}