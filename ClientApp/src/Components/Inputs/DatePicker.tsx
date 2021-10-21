import moment from "moment";
import { Moment } from "moment";
import React from "react";

interface IDatePickerProps {
  defaultDate?: Moment;
  inputProps?: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
  onChange?: (date: Moment) => void;
}

interface IDatePickerState {
  currentDate: Moment;
}

export class DatePicker extends React.Component<IDatePickerProps, IDatePickerState> {

  constructor(props: IDatePickerProps) {
    super(props);
    this.state = {
      currentDate: props.defaultDate ?? moment()
    };
    this.handleChange = this.handleChange.bind(this);
  }

  private handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    let value = event.target.value;
    let newDate = moment(value).startOf('day');
    this.setState({
      currentDate: newDate
    });
    if (this.props.onChange) {
      this.props.onChange(newDate);
    }
  }

  render() {
    //Don't allow setting type
    if (this.props.inputProps) {
      this.props.inputProps.type = undefined;
    }
    return <input {...this.props.inputProps} type='date' onChange={this.handleChange} value={this.state.currentDate.format("yyyy-MM-DD")} />
  }
}