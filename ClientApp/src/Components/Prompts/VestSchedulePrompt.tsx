import React, { useEffect, useState } from "react"
import { Button, ButtonGroup, FormControl, InputGroup, Modal, Table } from "react-bootstrap"
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { autobind } from "../../Utilities/Decorators";
import { FileLoader } from "../../Utilities/FileUtils";
import { LoadingButton } from "./LoadingButton";

import styles from "../../styles/PaymentSchedulePrompt.module.css";
import { ScheduledStockVest, ScheduledStockVestOptions, VestSchedule } from "../../Processing/Models/VestSchedule";
import { CurrencyInput } from "../Inputs/CurrencyInput";
import { NumberInput } from "../Inputs/NumberInput";
import { DatePicker } from "../Inputs/DatePicker";
import moment from "moment";

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
  vestToEdit?: ScheduledStockVest,
  pendingVestChanges?: ScheduledStockVestOptions,
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
          createMode: VestScheduleCreateMode.manual
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
    if (this.state.vestToEdit) {
      if (this.state.pendingVestChanges) {
        const vests = this.state.vests.filter(item => item !== this.state.vestToEdit);
        vests.push(new ScheduledStockVest(this.state.pendingVestChanges));
        this.setState({
          vests: vests,
          vestToEdit: undefined,
          pendingVestChanges: undefined
        })
      } else {
        this.cancel();
      }
    } else {
      this.setState({
        isSaving: true
      });
      if (this.props.editing) {
        await AppStateManager.addVestSchedule(
          new VestSchedule({
            id: this.props.scheduleToEdit,
            name: this.state.name,
            vests: this.state.vests
          })
        );
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
  }

  @autobind
  private cancel() {
    if (this.state.vestToEdit) {
      this.setState({
        vestToEdit: undefined,
        pendingVestChanges: undefined
      });
    } else {
      PromptManager.requestClosePrompt();
    }
  }

  @autobind
  private onAddNewVest() {
    const newVest = new ScheduledStockVest({
      name: "",
      date: moment(),
      shares: 0,
      costBasisPerShare: 0,
      symbol: "",
      taxPercentage: 0
    });
    this.setState({
      vestToEdit: newVest
    });
  }

  @autobind
  private onEditSpecificVest(vest: ScheduledStockVest) {
    this.setState({
      vestToEdit: vest
    });
  }

  @autobind
  private onDeleteSpecificVest(vest: ScheduledStockVest) {
    const vests = this.state.vests.filter(item => item !== vest);
    this.setState({
      vests: vests
    });
  }

  @autobind
  private handlePendingVestChanges(changes: ScheduledStockVestOptions) {
    this.setState({
      pendingVestChanges: changes
    });
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
          <VestSchedulePreview
            vests={this.state.vests}
            editable
            onAddClicked={this.onAddNewVest}
            onEditClicked={this.onEditSpecificVest}
            onDeleteClicked={this.onDeleteSpecificVest}
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

  private renderModalBody() {
    if (this.state.vestToEdit) {
      const vest = this.state.vestToEdit;
      return (
        <>
          <VestEditor vest={vest} onChangeMade={this.handlePendingVestChanges} />
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
              <option value={VestScheduleCreateMode.csv}>CSV</option>
              <option value={VestScheduleCreateMode.manual}>Manual Input</option>
            </FormControl>
          </InputGroup>
          {this.renderControlsForMode()}
        </>
      )
    }
  }

  private renderViewOnly() {
    const schedule = AppStateManager.getVestSchedule(this.props.scheduleToEdit!);
    if (schedule) {
      const symbols = new Set(schedule.vests.map(item => item.symbol));
      const title = symbols.size > 1 ? schedule.name : `${schedule.name} - ${[...symbols][0]}`;
      return (
        <>
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
        </>
      );
    }
  }



  renderDefault() {
    const title = this.state.vestToEdit ? this.state.vestToEdit.name : `${(this.props.editing ? "Update" : "Add")} Stock Vest Schedule`;
    const buttonText = this.state.vestToEdit ? "Done" : (this.props.editing ? "Update" : "Add")
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
        {this.props.viewOnly ? this.renderViewOnly() : this.renderDefault()}
      </Modal>
    )
  }
}


interface IVestEditorProps {
  vest: ScheduledStockVest;
  onChangeMade?: (options: ScheduledStockVestOptions) => void;
}

const VestEditor: React.FC<IVestEditorProps> = (props) => {

  const [name, setName] = useState(props.vest.name);
  const [symbol, setSymbol] = useState(props.vest.symbol);
  const [shares, setShares] = useState(props.vest.shares);
  const [date, setDate] = useState(props.vest.date);
  const [costBasis, setCostBasis] = useState(props.vest.costBasisPerShare);
  const [taxRate, setTaxRate] = useState(props.vest.taxPercentage);

  useEffect(() => {
    if (props.onChangeMade) {
      props.onChangeMade({
        name,
        symbol,
        shares,
        date,
        costBasisPerShare: costBasis,
        taxPercentage: taxRate
      });
    }
  }, [name, symbol, shares, date, costBasis, taxRate]);

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
        <FormControl
          placeholder="Symbol"
          aria-label="Ticker Symbol"
          onChange={e => setSymbol(e.target.value)}
          value={symbol}
          maxLength={5}
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
        <InputGroup.Prepend>
          <InputGroup.Text>Tax Rate</InputGroup.Text>
        </InputGroup.Prepend>
        <NumberInput
          defaultValue={taxRate}
          ariaLabel="tax rate"
          onChange={val => setTaxRate(val / 100)}
        />
        <InputGroup.Append>
          <InputGroup.Text>%</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      <label>Cost Basis</label>
      <InputGroup className="mb-3">
        <NumberInput
          defaultValue={shares}
          ariaLabel="Number of shares"
          onChange={setShares}
        />
        <InputGroup.Append>
          <InputGroup.Text>Shares</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>@</InputGroup.Text>
        </InputGroup.Prepend>
        <CurrencyInput
          ariaLabel="Cost basis per share"
          defaultValue={costBasis}
          onChange={setCostBasis}
        />
        <InputGroup.Append>
          <InputGroup.Text>Per Share</InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>

    </>
  )
}

interface IVestSchedulePreviewProps {
  editable?: boolean;
  vests: ScheduledStockVest[];
  onEditClicked?: (vest: ScheduledStockVest) => void;
  onDeleteClicked?: (vest: ScheduledStockVest) => void;
  onAddClicked?: () => void;
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
  function throwError(err: Error) {
    throw err;
  }

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
              <Button onClick={() => props.onEditClicked ? props.onEditClicked(vest) : throwError(new Error("No edit function specified"))}>
                <i className="bi bi-pencil"></i>
              </Button>
              <Button onClick={() => props.onDeleteClicked ? props.onDeleteClicked(vest) : throwError(new Error("No delete function specified"))} variant='secondary'>
                <i className="bi bi-trash"></i>
              </Button>
            </ButtonGroup>
          </td>
        )}
      </tr>
    );
  }

  function renderSchedule() {
    const colCount = symbols.size > 1 ? 5 : 4;
    return (
      <div className={styles["table-container"]} >
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
            {props.editable && (
              <tr>
                <td colSpan={colCount}>
                  <Button className={styles["add-button"]} onClick={props.onAddClicked}>
                    <i className="bi bi-plus-lg" />
                  </Button>
                </td>
              </tr>
            )}
            {props.vests.map(renderPayment)}
          </tbody>
        </Table>
      </div>
    );
  }

  return renderSchedule();
}