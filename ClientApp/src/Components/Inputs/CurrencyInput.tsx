import React from "react";
import { FormControl } from "react-bootstrap";
import { autobind } from "../../Utilities/Decorators";

interface ICurrencyInputProps {
    onChange?: (newVal: number, oldVal: number) => void;
    onInvalidStateChanged?: (invalid: boolean) => void;
    ariaLabel?: string;
    defaultValue?: number;
}

interface ICurrencyInputState {
    value: number;
    strValue: string;
    invalid: boolean;
}

export class CurrencyInput extends React.Component<ICurrencyInputProps, ICurrencyInputState> {

    constructor(props: ICurrencyInputProps) {
        super(props);

        this.state = {
            value: this.props.defaultValue ?? 0,
            invalid: false,
            strValue: `$${this.props.defaultValue?.toString()}` ?? "$0"
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
                    value: Number(value),
                    invalid: false,
                    strValue: `$${value}`
                });
            }
        } else {
            if (!this.state.invalid && this.props.onInvalidStateChanged) {
                this.props.onInvalidStateChanged(true);
            }
            this.setState({
                invalid: true,
                strValue: `$${value}`
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