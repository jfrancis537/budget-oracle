import moment from "moment";
import { useEffect, useState } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import { GetStockPriceNow } from "../../APIs/StockAPI";
import { AppStateManager } from "../../Processing/Managers/AppStateManager";
import { CalculationsManager } from "../../Processing/Managers/CalculationsManager";
import { InvestmentCalculationManager } from "../../Processing/Managers/InvestmentCalculationManager";
import { PromptManager } from "../../Processing/Managers/PromptManager";
import { VestSchedule } from "../../Processing/Models/VestSchedule";

import itemStyles from '../../styles/Item.module.css';

interface IScheduledVestProps {
  schedule: VestSchedule
}


export const ScheduledVestItem: React.FC<IScheduledVestProps> = (props) => {

  const [showBreakdown, setShowBreakdown] = useState(true);
  const [symbolValues, setSymbolValues] = useState(getBaseSymbolValues());

  useEffect(() => {
    InvestmentCalculationManager.onsymbolvaluecalculated.addListener(onSymbolValueUpdated);
    getSymbolValues()
      .then(values => {
        setSymbolValues(values)
      })
      .catch(err => {
        throw new Error(err);
      });
    return () => {
      InvestmentCalculationManager.onsymbolvaluecalculated.removeListener(onSymbolValueUpdated);
    }
  }, []);

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

  async function getSymbolValues() {
    const result = new Map<string, number>();
    for (let item of props.schedule.vests) {
      const symbolKey = item.symbol.toLowerCase();
      const price = await InvestmentCalculationManager.getStockPriceForSymbol(symbolKey, true);
      if (price) {
        result.set(symbolKey, price);
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
    let end = CalculationsManager.instance.endDate;
    let sum = 0;
    for (let vest of props.schedule.vests) {
      if (vest.date.isSameOrAfter(start) && vest.date.isSameOrBefore(end)) {
        const key = vest.symbol.toLowerCase();
        const symbolValue = symbolValues.get(key)!;
        sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
      }
    }
    return sum.toFixed(2);
  }

  function calculateRemaining() {
    let end = CalculationsManager.instance.endDate;
    let sum = 0;
    for (let vest of props.schedule.vests) {
      if (vest.date.isAfter(end)) {
        const key = vest.symbol.toLowerCase();
        const symbolValue = symbolValues.get(key)!;
        sum += (symbolValue * vest.shares * (1 - vest.taxPercentage));
      }
    }
    return sum.toFixed(2);
  }

  function toggleBreakdown() {
    setShowBreakdown(!showBreakdown);
  }

  function view() {
    PromptManager.requestVestSchedulePrompt({
      editing: true,
      viewOnly: true,
      scheduleToEdit: props.schedule.id
    });
  }

  async function remove() {
    await AppStateManager.deleteItem(props.schedule.id);
  }

  function render(): JSX.Element {
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
          <span>{props.schedule.name}: </span>
          <span onClick={toggleBreakdown}>
            {showBreakdown ? (
              `${calculateRedeemed()} / ${calculateInterim()} / ${calculateRemaining()}`
            ) : (
              calculateTotalPotentialValue()
            )}
          </span>
        </div>
      </div>
    );
  }
  return render();
} 