import React from "react"
import { Button, ButtonGroup, FormControl, InputGroup, Modal, Table } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { FileLoader } from "../../Utilities/FileUtils";
import { LoadingButton } from "./LoadingButton";

import styles from "../../styles/PaymentSchedulePrompt.module.css";
import { ScheduledStockVest, VestSchedule } from "../../Processing/Models/VestSchedule";

export interface IVestSchedulePromptProps {
  editing: boolean;
  viewOnly: boolean;
  scheduleToEdit?: string;
}

interface IVestSchedulePromptState {
  name: string,
  vests: ScheduledStockVest[],
  isSaving: boolean,
  createMode: VestScheduleCreateMode,
  errorMessage?: string
}

enum VestScheduleCreateMode {
  csv = "csv",
  manual = "mannual"
}

export class VestSchedulePrompt extends React.Component<IVestSchedulePromptProps, IVestSchedulePromptState> {

  constructor(props: IVestSchedulePromptProps) {
    super(props);

    if (this.props.editing) {
      const scheduleId = this.props.scheduleToEdit;
      if (scheduleId && AppStateManager.hasVestSchedule(scheduleId)) {
        const schedule = AppStateManager.getVestSchedule(scheduleId)!;
        this.state = {
          name: schedule.name,
          vests: schedule.vests,
          isSaving: false,
          createMode: VestScheduleCreateMode.csv
        }
      } else {
        throw new Error('A Bill to edit must be provided if editing flag is true');
      }
    } else {
      this.state = {
        name: '',
        vests: [],
        isSaving: false,
        createMode: VestScheduleCreateMode.csv
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
    let value = event.target.value as VestScheduleCreateMode;
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
      await AppStateManager.addVestSchedule(
        new VestSchedule({
          name: this.state.name,
          vests: this.state.vests
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
      case VestScheduleCreateMode.csv:
        result = (
          <>
            <InputGroup className={styles["csv-group"]}>
              <Button onClick={this.uploadCSV}>Upload CSV</Button>
              <label className={styles["error"]}>{this.state.errorMessage ?? ""}</label>
            </InputGroup>
            <VestSchedulePreview vests={this.state.vests} />
          </>
        );
        break;
      case VestScheduleCreateMode.manual:
        result = (
          <VestSchedulePreview vests={this.state.vests} editable />
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
        let schedule = VestSchedule.fromCSV(this.state.name, csvText);
        this.setState({
          vests: schedule.vests
        });
      } catch {
        this.setState({
          errorMessage: "Failed to upload CSV. Ensure the document was formatted correctly."
        });
      }
    }
  }

  private renderViewOnly() {
    const schedule = AppStateManager.getVestSchedule(this.props.scheduleToEdit!);
    if (schedule) {
      const symbols = new Set(schedule.vests.map(item => item.symbol));
      const title = symbols.size > 1 ? schedule.name : `${schedule.name} - ${[...symbols][0]}`;
      return (
        <Modal
          show
          onHide={this.cancel}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <VestSchedulePreview vests={schedule.vests} />
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
          <Modal.Title>{this.props.editing ? "Update" : "Add"} Stock Vest Schedule</Modal.Title>
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
              <option value={VestScheduleCreateMode.csv}>CSV</option>
              <option value={VestScheduleCreateMode.manual}>Manual Input</option>
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

interface IVestSchedulePreviewProps {
  editable?: boolean;
  vests: ScheduledStockVest[];
}

const VestSchedulePreview: React.FC<IVestSchedulePreviewProps> = (props) => {

  props.vests.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  const symbols = new Set(props.vests.map(item => item.symbol));
  //TODO Get share price to get value
  // useEffect(() => {
  //   InvestmentCalculationManager.getStockPriceForSymbol(props.)
  //   return () => {

  //   }
  // },[]);

  function renderPayment(vest: ScheduledStockVest) {
    return (
      <tr key={vest.id}>
        <td>{vest.name}</td>
        {symbols.size > 1 && <td>{vest.symbol}</td>}
        <td>{vest.shares}</td>
        <td>{vest.date.format("L")}</td>
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
              {symbols.size > 1 && <th>Symbol</th>}
              <th>Shares</th>
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
            {props.vests.map(renderPayment)}
          </tbody>
        </Table>
      </div>
    );
  }

  function render(): JSX.Element {
    let result: JSX.Element;
    if (props.vests.length === 0) {
      result = (
        <div className={styles["no-payments-message"]}>No stock vests have been created yet.</div>
      );
    } else {
      result = renderSchedule();
    }
    return result;
  }

  return render();
}