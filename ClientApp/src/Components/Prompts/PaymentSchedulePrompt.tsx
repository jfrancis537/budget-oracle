import React, { useEffect, useState } from "react"
import { Button, ButtonGroup, FormControl, InputGroup, Modal, Table } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { FileLoader } from "../../Utilities/FileUtils";
import { LoadingButton } from "./LoadingButton";

import styles from "../../styles/PaymentSchedulePrompt.module.css";
import { CurrencyInput } from "../Inputs/CurrencyInput";
import { DatePicker } from "../Inputs/DatePicker";
import moment from "moment";
import { PaymentSchedule, ScheduledPayment, ScheduledPaymentOptions } from "../../Processing/Models/ScheduledPayment";

export interface IPaymentSchedulePromptProps {
  editing: boolean;
  viewOnly: boolean;
  scheduleToEdit?: string;
}

interface IPaymentSchedulePromptState {
  name: string,
  payments: ScheduledPayment[],
  isSaving: boolean,
  createMode: CreateMode,
  paymentToEdit?: ScheduledPayment,
  pendingPaymentChanges?: ScheduledPaymentOptions,
  errorMessage?: string
}

enum CreateMode {
  csv = "csv",
  manual = "mannual"
}

export class PaymentSchedulePrompt extends React.Component<IPaymentSchedulePromptProps, IPaymentSchedulePromptState> {

  constructor(props: IPaymentSchedulePromptProps) {
    super(props);

    if (this.props.editing) {
      const scheduleId = this.props.scheduleToEdit;
      if (scheduleId && AppStateManager.hasPaymentSchedule(scheduleId)) {
        const schedule = AppStateManager.getPaymentSchedule(scheduleId)!;
        this.state = {
          name: schedule.name,
          payments: schedule.payments,
          isSaving: false,
          createMode: CreateMode.manual
        }
      } else {
        throw new Error('A Bill to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        payments: [],
        isSaving: false,
        createMode: CreateMode.csv
      };
    }
  }

  @autobind
  private handleNameChanged(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      name: event.target.value
    });
  }

  @autobind
  private handleCreateModeChanged(event: React.ChangeEvent<HTMLInputElement>) {
    let value = event.target.value as CreateMode;
    this.setState({
      createMode: value
    });
  }

  @autobind
  private async accept() {
    if (this.state.paymentToEdit) {
      if (this.state.pendingPaymentChanges) {
        const payments = this.state.payments.filter(item => item !== this.state.paymentToEdit);
        payments.push(new ScheduledPayment(this.state.pendingPaymentChanges));
        this.setState({
          payments: payments,
          paymentToEdit: undefined,
          pendingPaymentChanges: undefined
        })
      } else {
        this.cancel();
      }
    } else {
      this.setState({
        isSaving: true
      });
      if (this.props.editing) {
        await AppStateManager.addPaymentSchedule(
          new PaymentSchedule({
            id: this.props.scheduleToEdit,
            name: this.state.name,
            payments: this.state.payments
          })
        );
      } else {
        await AppStateManager.addPaymentSchedule(
          new PaymentSchedule({
            name: this.state.name,
            payments: this.state.payments
          })
        );
      }
      this.setState({
        isSaving: false
      });
      PromptManager.requestClosePrompt();
    }
  }

  @autobind
  private cancel() {
    if (this.state.paymentToEdit) {
      this.setState({
        paymentToEdit: undefined,
        pendingPaymentChanges: undefined
      });
    } else {
      PromptManager.requestClosePrompt();
    }
  }

  @autobind
  private onAddNewPayment() {
    const newPayment = new ScheduledPayment({
      name: "",
      date: moment(),
      amount: 0
    });
    this.setState({
      paymentToEdit: newPayment
    });
  }

  @autobind
  private onEditSpecificPayment(payment: ScheduledPayment) {
    this.setState({
      paymentToEdit: payment
    });
  }

  @autobind
  private onDeleteSpecificPayment(payment: ScheduledPayment) {
    const payments = this.state.payments.filter(item => item !== payment);
    this.setState({
      payments: payments
    });
  }

  @autobind
  private handlePendingPaymentChanges(changes: ScheduledPaymentOptions) {
    this.setState({
      pendingPaymentChanges: changes
    });
  }

  private renderControlsForMode() {
    let result: JSX.Element
    switch (this.state.createMode) {
      case CreateMode.csv:
        result = (
          <>
            <InputGroup className={styles["csv-group"]}>
              <Button onClick={this.uploadCSV}>Upload CSV</Button>
              <label className={styles["error"]}>{this.state.errorMessage ?? ""}</label>
            </InputGroup>
            <PaymentSchedulePreview payments={this.state.payments} />
          </>
        );
        break;
      case CreateMode.manual:
        result = (
          <PaymentSchedulePreview
            payments={this.state.payments}
            editable
            onAddClicked={this.onAddNewPayment}
            onEditClicked={this.onEditSpecificPayment}
            onDeleteClicked={this.onDeleteSpecificPayment}
          />
        )
        break;
    }
    return result;
  }

  @autobind
  private async uploadCSV() {

    if (!this.props.editing || window.confirm("Uploading a CSV will overwrite existing schedule. Do you want to continue?")) {
      try {
        let file = await FileLoader.openWithDialog();
        let csvText = await FileLoader.readAsText(file);
        let schedule = PaymentSchedule.fromCSV(this.state.name, csvText);
        this.setState({
          payments: schedule.payments
        });
      } catch {
        this.setState({
          errorMessage: "Failed to upload CSV. Ensure the document was formatted correctly."
        });
      }
    }
  }

  private renderModalBody() {
    if (this.state.paymentToEdit) {
      const payment = this.state.paymentToEdit;
      return (
        <>
          <PaymentEditor payment={payment} onChangeMade={this.handlePendingPaymentChanges} />
        </>
      )
    } else {
      return (
        <>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="Name"
              aria-label="name"
              onChange={this.handleNameChanged}
              value={this.state.name}
            />
          </InputGroup>
          <InputGroup className="mb-3">
            <FormControl
              as='select'
              onChange={this.handleCreateModeChanged}
              value={this.state.createMode}
            >
              <option value={CreateMode.csv}>CSV</option>
              <option value={CreateMode.manual}>Manual Input</option>
            </FormControl>
          </InputGroup>
          {this.renderControlsForMode()}
        </>
      )
    }
  }

  renderDefault() {
    const title = this.state.paymentToEdit ? this.state.paymentToEdit.name : `${(this.props.editing ? "Update" : "Add")} Payment Schedule`;
    const buttonText = this.state.paymentToEdit ? "Done" : (this.props.editing ? "Update" : "Add")
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles["modal-body"]}>
          {this.renderModalBody()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.state.name || this.state.isSaving}>
            {buttonText}
          </LoadingButton>
        </Modal.Footer>
      </>
    )
  }

  render() {
    return (
      <Modal
        show
        onHide={this.cancel}
        backdrop="static"
        keyboard={false}
        contentClassName={styles["modal"]}
      >
        {this.renderDefault()}
      </Modal>
    )
  }
}


interface IPaymentEditorProps {
  payment: ScheduledPayment;
  onChangeMade?: (options: ScheduledPaymentOptions) => void;
}

const PaymentEditor: React.FC<IPaymentEditorProps> = (props) => {

  const [name, setName] = useState(props.payment.name);
  const [amount, setAmount] = useState(props.payment.amount);
  const [date, setDate] = useState(props.payment.date);

  useEffect(() => {
    if (props.onChangeMade) {
      props.onChangeMade({
        name,
        date,
        amount
      });
    }
  }, [name, amount, date]);

  return (
    <>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Name"
          aria-label="name"
          onChange={e => setName(e.target.value)}
          value={name}
        />
      </InputGroup>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>
            <i className="bi bi-calendar-event" />
          </InputGroup.Text>
        </InputGroup.Prepend>
        <DatePicker defaultDate={date} calendarIconBackgroundEnabled className="form-control" onChange={setDate} />
      </InputGroup>
      <InputGroup className="mb-3">
        <CurrencyInput
          ariaLabel="Value"
          defaultValue={amount}
          onChange={setAmount}
        />
      </InputGroup>

    </>
  )
}

interface IPaymentSchedulePreviewProps {
  editable?: boolean;
  payments: ScheduledPayment[];
  onEditClicked?: (payment: ScheduledPayment) => void;
  onDeleteClicked?: (payment: ScheduledPayment) => void;
  onAddClicked?: () => void;
}

const PaymentSchedulePreview: React.FC<IPaymentSchedulePreviewProps> = (props) => {

  props.payments.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  function throwError(err: Error) {
    throw err;
  }

  function renderPayment(payment: ScheduledPayment) {
    return (
      <tr key={payment.id}>
        <td>{payment.name}</td>
        <td>{payment.amount}</td>
        <td>{payment.date.format("L")}</td>
        {props.editable && (
          <td>
            <ButtonGroup className={`mr-2`} size='sm'>
              <Button onClick={() => props.onEditClicked ? props.onEditClicked(payment) : throwError(new Error("No edit function specified"))}>
                <i className="bi bi-pencil"></i>
              </Button>
              <Button onClick={() => props.onDeleteClicked ? props.onDeleteClicked(payment) : throwError(new Error("No delete function specified"))} variant='secondary'>
                <i className="bi bi-trash"></i>
              </Button>
            </ButtonGroup>
          </td>
        )}
      </tr>
    );
  }

  function renderSchedule() {
    const colCount = 4;
    return (
      <div className={styles["table-container"]} >
        <Table responsive={"sm"}>
          <thead>
            <tr>
              <th>Name</th>
              <th><i className="bi bi-cash"></i></th>
              <th>
                <i className="bi bi-calendar" />
              </th>
              {props.editable && (
                <th>
                  <i className="bi bi-gear" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {props.editable && (
              <tr>
                <td colSpan={colCount}>
                  <Button className={styles["add-button"]} onClick={props.onAddClicked}>
                    <i className="bi bi-plus-lg" />
                  </Button>
                </td>
              </tr>
            )}
            {props.payments.map(renderPayment)}
          </tbody>
        </Table>
      </div>
    );
  }

  return renderSchedule();
}