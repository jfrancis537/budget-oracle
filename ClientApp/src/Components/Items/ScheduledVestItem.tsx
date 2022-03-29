import moment, { Moment } from "moment";
import { useEffect, useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { CalculationsManager } from "../../Processing/Managers/CalculationsManager";
import { InvestmentCalculationManager } from "../../Processing/Managers/InvestmentCalculationManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { VestSchedule } from "../../Processing/Models/VestSchedule";

import itemStyles from '../../styles/Item.module.css';
import vestStyles from '../../styles/ScheduleVestItem.module.css';

interface IScheduledVestProps {
  schedule: VestSchedule
}

enum DisplayMode {
  Interim = "Interim",
  Vested = "Vested",
  Unvested = "Unvested",
  TotalValue = "Total Value"
}

namespace DisplayMode {
  export const itr = function* () {
    yield DisplayMode.Interim;
    yield DisplayMode.Vested;
    yield DisplayMode.Unvested;
    yield DisplayMode.TotalValue;
  }

  export function getNext(current: DisplayMode): DisplayMode {
    let result: DisplayMode;
    switch (current) {
      case DisplayMode.Interim:
        result = DisplayMode.Vested;
        break;
      case DisplayMode.Vested:
        result = DisplayMode.Unvested;
        break;
      case DisplayMode.Unvested:
        result = DisplayMode.TotalValue;
        break;
      case DisplayMode.TotalValue:
        result = DisplayMode.Interim;
        break;
    }
    return result;
  }
}


export const ScheduledVestItem: React.FC<IScheduledVestProps> = (props) => {

  const [displayMode, setDisplayMode] = useState(DisplayMode.Interim);
  const [symbolValues, setSymbolValues] = useState(getBaseSymbolValues());
  const [endDate, setEndDate] = useState(CalculationsManager.instance.endDate);

  useEffect(() => {
    InvestmentCalculationManager.onsymbolvaluecalculated.addListener(onSymbolValueUpdated);
    CalculationsManager.instance.onenddatechanged.addListener(handleEndDateChanged);
    getSymbolValues(true)
      .then(values => {
        setSymbolValues(values)
      })
      .catch(err => {
        throw new Error(err);
      });
    return () => {
      InvestmentCalculationManager.onsymbolvaluecalculated.removeListener(onSymbolValueUpdated);
      CalculationsManager.instance.onenddatechanged.removeListener(handleEndDateChanged);
    }
  }, []);

  function handleEndDateChanged(date: Moment) {
    setEndDate(date);
  }

  function onSymbolValueUpdated(data: { symbol: string, value: number }) {
    const symbolKey = data.symbol.toLowerCase();
    symbolValues.set(symbolKey, data.value);
    setSymbolValues(symbolValues);
  }

  function getBaseSymbolValues() {
    const result = new Map<string, number>();
    for (let item of props.schedule.vests) {
      const symbolKey = item.symbol.toLowerCase();
      if (!result.has(symbolKey)) {
        result.set(symbolKey, 0);
      }
      const currentValue = result.get(symbolKey)!;
      result.set(symbolKey, (currentValue + item.costBasisPerShare) / 2)
    }
    return result;
  }

  async function getSymbolValues(refresh = false) {
    const result = new Map<string, number>();
    for (let item of props.schedule.vests) {
      const symbolKey = item.symbol.toLowerCase();
      if (!result.has(symbolKey)) {
        const price = await InvestmentCalculationManager.getStockPriceForSymbol(symbolKey, refresh);
        if (price) {
          result.set(symbolKey, price);
        }
      }
    }
    return result;
  }


  function calculateTotalPotentialValue() {
    let sum = 0;
    for (let vest of props.schedule.vests) {
      const key = vest.symbol.toLowerCase();
      const symbolValue = symbolValues.get(key)!;
      sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
    }
    return sum.toFixed(2);
  }

  function calculateRedeemed() {
    let start = moment().startOf('day');
    let sum = 0;
    for (let vest of props.schedule.vests) {
      if (vest.date.isBefore(start)) {
        const key = vest.symbol.toLowerCase();
        const symbolValue = symbolValues.get(key)!;
        sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
      }
    }
    return sum.toFixed(2);
  }

  function calculateInterim() {
    let start = moment().startOf('day');
    let sum = 0;
    for (let vest of props.schedule.vests) {
      if (vest.date.isSameOrAfter(start) && vest.date.isSameOrBefore(endDate)) {
        const key = vest.symbol.toLowerCase();
        const symbolValue = symbolValues.get(key)!;
        sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
      }
    }
    return sum.toFixed(2);
  }

  function calculateRemaining() {
    let sum = 0;
    for (let vest of props.schedule.vests) {
      if (vest.date.isAfter(endDate)) {
        const key = vest.symbol.toLowerCase();
        const symbolValue = symbolValues.get(key)!;
        sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
      }
    }
    return sum.toFixed(2);
  }

  function toggleBreakdown() {
    setDisplayMode(DisplayMode.getNext(displayMode));
  }

  function view() {
    PromptManager.requestVestSchedulePrompt({
      editing: true,
      viewOnly: true,
      scheduleToEdit: props.schedule.id
    });
  }

  function edit() {
    PromptManager.requestVestSchedulePrompt({
      editing: true,
      viewOnly: false,
      scheduleToEdit: props.schedule.id
    });
  }

  async function refresh() {
    const values = await getSymbolValues(true);
    setSymbolValues(values);
  }

  async function remove() {
    await AppStateManager.deleteItem(props.schedule.id);
  }

  function renderCurrentMode() {
    switch (displayMode) {
      case DisplayMode.Interim:
        return <div>${calculateInterim()}</div>
      case DisplayMode.Vested:
        return <div>${calculateRedeemed()}</div>
      case DisplayMode.Unvested:
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
          <Button onClick={refresh} variant='secondary'>
            <i className="bi bi-arrow-clockwise"></i>
          </Button>
        </ButtonGroup>
        <div className={vestStyles["data-container"]}>
          <div className={vestStyles["title"]}>{props.schedule.name}</div>
          <div className={vestStyles["value"]} onClick={toggleBreakdown}>
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