import moment from "moment";
import { useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { CalculationsManager } from "../../Processing/Managers/CalculationsManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { PaymentSchedule } from "../../Processing/Models/ScheduledPayment"

import itemStyles from '../../styles/Item.module.css';

interface IScheduledItemProps {
  paymentSchedule: PaymentSchedule
}


export const ScheduledPaymentItem: React.FC<IScheduledItemProps> = (props) => {

  const [showBreakdown, setShowBreakdown] = useState(true);

  function calculateTotalPotentialValue() {
    return props.paymentSchedule.payments.reduce((prev, current) => prev + current.amount, 0);
  }

  function calculateRedeemed() {
    let start = moment().startOf('day');
    return props.paymentSchedule.payments.reduce((prev, current) => {
      const newValue = current.date.isBefore(start) ? current.amount : 0;
      return prev + newValue;
    }, 0);
  }

  function calculateInterim() {
    let start = moment().startOf('day');
    let end = CalculationsManager.instance.endDate;
    return props.paymentSchedule.payments.reduce((prev, current) => {
      const newValue = current.date.isSameOrAfter(start) && current.date.isSameOrBefore(end) ? current.amount : 0;
      return prev + newValue;
    }, 0);
  }

  function calculateRemaining() {
    let end = CalculationsManager.instance.endDate;
    return props.paymentSchedule.payments.reduce((prev, current) => {
      const newValue = current.date.isAfter(end) ? current.amount : 0;
      return prev + newValue;
    }, 0);
  }

  function toggleBreakdown() {
    setShowBreakdown(!showBreakdown);
  }

  function view() {
    PromptManager.requestPaymentSchedulePrompt({
      editing: true,
      viewOnly: true,
      scheduleToEdit: props.paymentSchedule.id
    });
  }

  async function remove() {
    await AppStateManager.deleteItem(props.paymentSchedule.id);
  }

  return (
    <div className={itemStyles['item-body']}>
      <ButtonGroup className="mr-2" size='sm'>
        <Button onClick={view}>
          <i className="bi bi-eye" />
        </Button>
        <Button onClick={remove} variant='secondary'>
          <i className="bi bi-trash"></i>
        </Button>
      </ButtonGroup>
      <div>
        <span>{props.paymentSchedule.name}: </span>
        <span onClick={toggleBreakdown}>
          {showBreakdown ? (
            `${calculateRedeemed()} / ${calculateInterim()} / ${calculateRemaining()}`
          ) : (
            calculateTotalPotentialValue()
          )}
        </span>
      </div>
    </div>

  )
}