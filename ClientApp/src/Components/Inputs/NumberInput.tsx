import React from "react";
import { FormControl } from "react-bootstrap";
import { autobind } from "../../Utilities/Decorators";

interface INumberInputProps {
  onChange?: (newVal: number, oldVal: number) => void;
  onInvalidStateChanged?: (invalid: boolean) => void;
  ariaLabel?: string;
  defaultValue?: number;
}

interface INumberInputState {
  value: number;
  strValue: string;
  invalid: boolean;
}

export class NumberInput extends React.Component<INumberInputProps, INumberInputState> {

  constructor(props: INumberInputProps) {
    super(props);

    this.state = {
      value: this.props.defaultValue ?? 0,
      invalid: false,
      strValue: this.props.defaultValue?.toString() ?? "0"
    }
  }

  @autobind
  private onChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.value.endsWith(".")) {
      const newValue = Number(event.target.value);
      if (!isNaN(newValue)) {
        if (this.props.onChange) {
          this.props.onChange(newValue, this.state.value);
        }
        if (this.state.invalid && this.props.onInvalidStateChanged) {
          this.props.onInvalidStateChanged(false);
        }
        this.setState({
          value: Number(event.target.value),
          invalid: false,
          strValue: event.target.value
        });
      }
    } else {
      if (!this.state.invalid && this.props.onInvalidStateChanged) {
        this.props.onInvalidStateChanged(true);
      }
      this.setState({
        invalid: true,
        strValue: event.target.value
      });
    }
  }

  public render() {
    return (
      <FormControl
        aria-label={this.props.ariaLabel}
        onChange={this.onChange}
        value={this.state.strValue}
        isInvalid={this.state.invalid}
      />
    )
  }
}