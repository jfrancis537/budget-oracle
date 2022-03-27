import React from "react"
import { Button, ButtonGroup, FormControl, InputGroup, Modal, Table } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { PaymentSchedule, ScheduledPayment } from "../../Processing/Models/ScheduledPayment";
import { autobind } from "../../Utilities/Decorators";
import { FileLoader } from "../../Utilities/FileUtils";
import { LoadingButton } from "./LoadingButton";

import styles from "../../styles/PaymentSchedulePrompt.module.css";

export interface IPaymentSchedulePromptProps {
  editing: boolean;
  viewOnly: boolean;
  scheduleToEdit?: string;
}

interface IPaymentSchedulePromptState {
  name: string,
  payments: ScheduledPayment[],
  isSaving: boolean,
  createMode: PaymentScheduleCreateMode,
  errorMessage?: string
}

enum PaymentScheduleCreateMode {
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
          createMode: PaymentScheduleCreateMode.csv
        }
      } else {
        throw new Error('A Bill to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        payments: [],
        isSaving: false,
        createMode: PaymentScheduleCreateMode.csv
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
    let value = event.target.value as PaymentScheduleCreateMode;
    this.setState({
      createMode: value
    });
  }

  @autobind
  private async accept() {
    this.setState({
      isSaving: true
    });
    if (this.props.editing) {
      // await AppStateManager.updateBill(
      //   this.props.billToEdit,
      //   this.state.name,
      //   this.state.value,
      //   this.state.frequency,
      //   this.state.frequencyType,
      //   this.state.initalDate,
      //   this.state.unavoidable
      // );
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

  @autobind
  private cancel() {
    PromptManager.requestClosePrompt();
  }

  private renderControlsForMode() {
    let result: JSX.Element
    switch (this.state.createMode) {
      case PaymentScheduleCreateMode.csv:
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
      case PaymentScheduleCreateMode.manual:
        result = (
          <PaymentSchedulePreview payments={this.state.payments} editable />
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

  private renderViewOnly() {
    const schedule = AppStateManager.getPaymentSchedule(this.props.scheduleToEdit!);
    if (schedule) {
      return (
        <Modal
          show
          onHide={this.cancel}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>{schedule.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <PaymentSchedulePreview payments={schedule.payments} />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>
              Done
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
  }

  renderDefault() {
    return (
      <Modal
        show
        onHide={this.cancel}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Payment Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
              disabled={this.props.editing}
            >
              <option value={PaymentScheduleCreateMode.csv}>CSV</option>
              <option disabled value={PaymentScheduleCreateMode.manual}>Manual Input</option>
            </FormControl>
          </InputGroup>
          {this.renderControlsForMode()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.cancel}>
            Cancel
          </Button>
          <LoadingButton isLoading={this.state.isSaving} loadingText="Saving..." variant="primary" onClick={this.accept} disabled={!this.state.name || this.state.isSaving}>
            {this.props.editing ? "Update" : "Add"}
          </LoadingButton>
        </Modal.Footer>
      </Modal>
    )
  }

  render() {
    if (this.props.viewOnly) {
      return this.renderViewOnly();
    } else {
      return this.renderDefault();
    }
  }
}

interface IPaymentSchedulePreviewProps {
  editable?: boolean;
  payments: ScheduledPayment[];
}

const PaymentSchedulePreview: React.FC<IPaymentSchedulePreviewProps> = (props) => {

  props.payments.sort((a, b) => a.date.valueOf() - b.date.valueOf());

  function renderPayment(payment: ScheduledPayment) {
    return (
      <tr key={payment.id}>
        <td>{payment.name}</td>
        <td>{payment.date.format("L")}</td>
        <td>${payment.amount}</td>
        {props.editable && (
          <td>
            <ButtonGroup className={`mr-2`} size='sm'>
              <Button onClick={() => { }}>
                <i className="bi bi-plus-square"></i>
              </Button>
              <Button onClick={() => { }} variant='secondary'>
                <i className="bi bi-trash"></i>
              </Button>
            </ButtonGroup>
          </td>
        )}
      </tr>
    );
  }

  function renderSchedule() {
    return (
      <div className={styles["table-container"]}>
        <Table responsive={"sm"}>
          <thead>
            <tr>
              <th>Name</th>
              <th>
                <i className="bi bi-calendar" />
              </th>
              <th>
                <i className="bi bi-cash-coin" />
              </th>
              {props.editable && (
                <th>
                  <i className="bi bi-gear" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {props.payments.map(renderPayment)}
          </tbody>
        </Table>
      </div>
    );
  }

  function render(): JSX.Element {
    let result: JSX.Element;
    if (props.payments.length === 0) {
      result = (
        <div className={styles["no-payments-message"]}>No payments have been created yet.</div>
      );
    } else {
      result = renderSchedule();
    }
    return result;
  }

  return render();
}