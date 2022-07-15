import {
  ChartDataset,
  ScatterDataPoint,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Chart
} from "chart.js";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { FormControl, InputGroup } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { NumberInput } from "./Inputs/NumberInput";
import styles from "../styles/Modeler.module.css";
import { CalculationResult } from "../Processing/Managers/CalculationsManager";
import { CalculationTools } from "../Utilities/CalculationTools";

enum ModelerResolution {
  Days,
  Weeks,
  Months,
  Years
}

namespace ModelerResolution {
  export function getDefaultCount(val: ModelerResolution): number {
    switch (val) {
      case ModelerResolution.Days:
        return 7;
      case ModelerResolution.Days:
        return 5;
      case ModelerResolution.Days:
        return 6;
      case ModelerResolution.Days:
        return 3;
      default:
        return 5;
    }
  }
}

enum ModelerMode {
  Line,
  Pie,
  Bar
}

interface IModelerProps {
  visible: boolean;
}

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export const Modeler: React.FC<IModelerProps> = (props) => {


  const [resolution, setResolution] = useState(ModelerResolution.Weeks);
  const [count, setCount] = useState(5);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  //TODO: Display Unrealized
  //TODO: Add estimated stock growth
  //TODO: add different chart types
  const [mode, setMode] = useState(ModelerMode.Line);

  useEffect(() => {
    fetchData().then(data => {
      setCalculations(data);
    });
  }, [resolution, count])

  async function fetchData() {
    const today = moment();
    const result = [await CalculationTools.requestCalculations(today, today)];
    switch (resolution) {
      case ModelerResolution.Days:
        {
          const curDay = today.clone();
          for (let i = 0; i < count; i++) {
            curDay.add(1, 'day');
            result.push(
              await CalculationTools.requestCalculations(today, curDay)
            );
          }
        }
        break;
      case ModelerResolution.Weeks:
        {
          const curDay = today.clone().startOf('week');
          for (let i = 0; i < count; i++) {
            curDay.add(1, 'week');
            result.push(
              await CalculationTools.requestCalculations(today, curDay)
            );
          }
        }
        break;
      case ModelerResolution.Months:
        {
          const curDay = today.clone().startOf('month');
          for (let i = 0; i < count; i++) {
            curDay.add(1, 'month');
            result.push(
              await CalculationTools.requestCalculations(today, curDay)
            );
          }
        }
        break;
      case ModelerResolution.Years:
        {
          const curDay = today.clone().startOf('year');
          for (let i = 0; i < count * 2; i++) {
            curDay.add(6, 'months');
            result.push(
              await CalculationTools.requestCalculations(today, curDay)
            );
          }
        }
        break;
    }
    return result;
  }

  function generateLabels(): string[] {
    const today = moment();
    const result: string[] = [];
    switch (resolution) {
      case ModelerResolution.Days:
        {
          const curDay = today.clone();
          for (let i = 0; i < count; i++) {
            result.push(curDay.format('M/D'));
            curDay.add(1, 'day');
          }
        }
        break;
      case ModelerResolution.Weeks:
        {
          const curDay = today.clone().startOf('week');
          for (let i = 0; i < count; i++) {
            result.push(curDay.format('M/D'));
            curDay.add(1, 'week');
          }
        }
        break;
      case ModelerResolution.Months:
        {
          const curDay = today.clone().startOf('month');
          for (let i = 0; i < count; i++) {
            result.push(curDay.format('MMM') + ".");
            curDay.add(1, 'month');
          }
        }
        break;
      case ModelerResolution.Years:
        {
          const curDay = today.clone().startOf('year');
          for (let i = 0; i < count * 2; i++) {
            if(i % 2 === 0)
            {
              result.push(curDay.format('YYYY'));
            } else {
              result.push("");
            }
            curDay.add(6, 'months');
          }
        }
        break;
    }
    return result;
  }

  function generateLineData(): ChartDataset<"line", (number | ScatterDataPoint | null)[]> {
    const data: number[] = [];
    for (let result of calculations) {
      data.push(CalculationTools.calculateTotal(result, false));
    }
    return {
      label: "data",
      data: data,
      backgroundColor: "#3f98f3",
      borderColor: "#3f98f3",
      xAxisID: "xAxis",
      yAxisID: "yAxis"
    }
  }

  function renderLineChart() {
    return (
      <Line
        data={{
          labels: generateLabels(),
          datasets: [generateLineData()]
        }}
        options={{
          responsive: true
        }}
        className={styles["line-chart"]}
      />
    );
  }

  function handleResolutionChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.currentTarget.value) as ModelerResolution;
    setResolution(value);
    setCount(ModelerResolution.getDefaultCount(value));
  }

  function handleCountChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.currentTarget.value);
    setCount(value as ModelerResolution);
  }

  function generateOptions(): JSX.Element[] {
    const elements: JSX.Element[] = [];
    let start = 0;
    let end = 0;
    switch (resolution) {
      case ModelerResolution.Days:
        start = 5;
        end = 10;
        break;
      case ModelerResolution.Weeks:
        start = 3;
        end = 12;
        break;
      case ModelerResolution.Months:
        start = 4;
        end = 12;
        break;
      case ModelerResolution.Years:
        start = 3;
        end = 5;
        break;
    }
    for (let i = start; i <= end; i++) {
      elements.push(
        <option value={i} key={`nodes_${i}`}>{i}</option>
      );
    }
    return elements;
  }

  function renderControls() {
    return (
      <div>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text>Resolution</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            as='select'
            onChange={handleResolutionChanged}
            value={resolution}
          >
            <option value={ModelerResolution.Days}>Days</option>
            <option value={ModelerResolution.Weeks}>Weeks</option>
            <option value={ModelerResolution.Months}>Months</option>
            <option value={ModelerResolution.Years}>Years</option>
          </FormControl>
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text>Nodes</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            as='select'
            onChange={handleCountChanged}
            value={count}
          >
            {generateOptions()}
          </FormControl>
        </InputGroup>
      </div>
    );
  }

  function render() {
    return (
      <div style={{display: props.visible ? undefined : "none"}}>
        {renderControls()}
        {calculations.length !== 0 && renderLineChart()}
      </div>
    );
  }
  return render();
}