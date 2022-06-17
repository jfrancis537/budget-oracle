import moment, { Moment } from "moment";
import { useEffect, useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { CalculationsManager } from "../../Processing/Managers/CalculationsManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { PaymentSchedule } from "../../Processing/Models/ScheduledPayment";

import itemStyles from '../../styles/Item.module.css';
import paymentStyles from '../../styles/ScheduleVestItem.module.css';

interface IScheduledPaymentProps {
  schedule: PaymentSchedule
}

enum DisplayMode {
  Interim = "Interim",
  Paid = "Paid",
  Upcoming = "Upcoming",
  TotalValue = "Total Value"
}

namespace DisplayMode {
  export const itr = function* () {
    yield DisplayMode.Interim;
    yield DisplayMode.Paid;
    yield DisplayMode.Upcoming;
    yield DisplayMode.TotalValue;
  }

  export function getNext(current: DisplayMode): DisplayMode {
    let result: DisplayMode;
    switch (current) {
      case DisplayMode.Interim:
        result = DisplayMode.Paid;
        break;
      case DisplayMode.Paid:
        result = DisplayMode.Upcoming;
        break;
      case DisplayMode.Upcoming:
        result = DisplayMode.TotalValue;
        break;
      case DisplayMode.TotalValue:
        result = DisplayMode.Interim;
        break;
    }
    return result;
  }
}


export const ScheduledPaymentItem: React.FC<IScheduledPaymentProps> = (props) => {

  const [displayMode, setDisplayMode] = useState(DisplayMode.Interim);
  const [endDate, setEndDate] = useState(CalculationsManager.instance.endDate);

  useEffect(() => {
    CalculationsManager.instance.onenddatechanged.addListener(handleEndDateChanged);
  }, []);

  function handleEndDateChanged(date: Moment) {
    setEndDate(date);
  }


  function calculateTotalPotentialValue() {
    let sum = 0;
    for (let payment of props.schedule.payments) {
      sum += payment.amount;
    }
    return sum.toFixed(2);
  }

  function calculateRedeemed() {
    let start = moment().startOf('day');
    let sum = 0;
    for (let payment of props.schedule.payments) {
      if (payment.date.isBefore(start)) {
        sum += payment.amount;
      }
    }
    return sum.toFixed(2);
  }

  function calculateInterim() {
    let start = moment().startOf('day');
    let sum = 0;
    for (let payment of props.schedule.payments) {
      if (payment.date.isSameOrAfter(start) && payment.date.isSameOrBefore(endDate)) {
        sum += payment.amount;
      }
    }
    return sum.toFixed(2);
  }

  function calculateRemaining() {
    let sum = 0;
    for (let payment of props.schedule.payments) {
      if (payment.date.isAfter(endDate)) {
        sum += payment.amount;
      }
    }
    return sum.toFixed(2);
  }

  function toggleBreakdown() {
    setDisplayMode(DisplayMode.getNext(displayMode));
  }

  function edit() {
    PromptManager.requestPaymentSchedulePrompt({
      editing: true,
      viewOnly: false,
      scheduleToEdit: props.schedule.id
    });
  }

  async function remove() {
    await AppStateManager.deleteItem(props.schedule.id);
  }

  function renderCurrentMode() {
    switch (displayMode) {
      case DisplayMode.Interim:
        return <div>${calculateInterim()}</div>
      case DisplayMode.Paid:
        return <div>${calculateRedeemed()}</div>
      case DisplayMode.Upcoming:
        return <div>${calculateRemaining()}</div>
      case DisplayMode.TotalValue:
        return <div>${calculateTotalPotentialValue()}</div>
    }
  }

  function render(): JSX.Element {
    return (
      <div className={itemStyles['item-body']}>
        <ButtonGroup className="mr-2" size='sm'>
          <Button onClick={edit}>
            <i className="bi bi-pencil" />
          </Button>
          <Button onClick={remove} variant='secondary'>
            <i className="bi bi-trash"></i>
          </Button>
        </ButtonGroup>
        <div className={paymentStyles["data-container"]}>
          <div className={paymentStyles["title"]}>{props.schedule.name}</div>
          <div className={paymentStyles["value"]} onClick={toggleBreakdown}>
            {displayMode}:&nbsp;{renderCurrentMode()}
          </div>
        </div>
      </div>
    );
  }
  return render();
}

// display: flex;
// background-color: #2d9b36;
// padding: 5px;
// border-radius: 5px;