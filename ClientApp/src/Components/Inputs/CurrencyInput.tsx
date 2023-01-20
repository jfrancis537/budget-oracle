import React from "react";
import {Form, InputGroup } from "react-bootstrap";
import { autobind } from "../../Utilities/Decorators";

interface ICurrencyInputProps {
  onChange?: (newVal: number, oldVal: number) => void;
  onInvalidStateChanged?: (invalid: boolean) => void;
  ariaLabel?: string;
  defaultValue?: number;
  symbol?: string;
  symbolLocation?: 'input' | 'label'
}

interface ICurrencyInputState {
  value: number;
  strValue: string;
  invalid: boolean;
}

export class CurrencyInput extends React.Component<ICurrencyInputProps, ICurrencyInputState> {

  constructor(props: ICurrencyInputProps) {
    super(props);
    const defaultValue = this.props.defaultValue ?? 0
    this.state = {
      value: defaultValue,
      invalid: false,
      strValue: this.formatToString(defaultValue)
    }
  }

  @autobind
  private onChange(event: React.ChangeEvent<HTMLInputElement>) {
    let value = event.target.value;
    if (value.startsWith("$")) {
      value = value.substring(1);
    }

    if (!value.endsWith(".")) {
      const newValue = Number(value);
      if (!isNaN(newValue)) {
        if (this.props.onChange) {
          this.props.onChange(newValue, this.state.value);
        }
        if (this.state.invalid && this.props.onInvalidStateChanged) {
          this.props.onInvalidStateChanged(false);
        }
        this.setState({
          value: newValue,
          invalid: false,
          strValue: this.formatToString(newValue)
        });
      }
    } else {
      if (!this.state.invalid && this.props.onInvalidStateChanged) {
        this.props.onInvalidStateChanged(true);
      }
      this.setState({
        invalid: true,
        strValue: this.formatToString(value)
      });
    }
  }

  private formatToString(value: number | string) {
    const symbol = this.props.symbol ?? '$';
    if (this.props.symbolLocation === 'input') {
      return `${symbol}${value}`;
    } else {
      return `${value}`
    }
  }

  public render() {
    return (
      <>
        {this.props.symbolLocation === 'label' && (
            <InputGroup.Text>{this.props.symbol ?? '$'}</InputGroup.Text>
        )}
        <Form.Control
          aria-label={this.props.ariaLabel}
          onChange={this.onChange}
          value={this.state.strValue}
          isInvalid={this.state.invalid}
        />
      </>

    )
  }
}