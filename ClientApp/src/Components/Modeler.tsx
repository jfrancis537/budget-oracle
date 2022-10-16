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
import styles from "../styles/Modeler.module.css";
import { CalculationResult } from "../Processing/Managers/CalculationsManager";
import { CalculationTools } from "../Utilities/CalculationTools";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

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
      case ModelerResolution.Weeks:
        return 5;
      case ModelerResolution.Months:
        return 6;
      case ModelerResolution.Years:
        return 3;
      default:
        return 5;
    }
  }
}

// enum ModelerMode {
//   Line,
//   Pie,
//   Bar
// }

interface IModelerProps {
  visible: boolean;
}

export const Modeler: React.FC<IModelerProps> = (props) => {


  const [resolution, setResolution] = useState(ModelerResolution.Weeks);
  const [count, setCount] = useState(5);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  //TODO: Display Unrealized
  //TODO: Add estimated stock growth - do this via a new anticipated growth field on investmetns. 
  //Allow for zero value investments.
  //TODO: add different chart types
  // const [mode, setMode] = useState(ModelerMode.Line);

  useEffect(() => {
    fetchData().then(data => {
      setCalculations(data);
    });
  }, [resolution, count, props.visible])

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
          const pastHalfYear = today.month() >= 5; //months are zero indexed lol
          const curDay = pastHalfYear ? today.clone().month(5).startOf('month') : today.clone().startOf('year');
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
          const pastHalfYear = today.month() >= 5; //months are zero indexed lol
          const intervals = count * 2;
          const startPos = pastHalfYear ? 1 : 0;
          const curDay = pastHalfYear ? today.clone().month(5).startOf('month') : today.clone().startOf('year');
          for (let i = startPos; i < intervals + startPos; i++) {
            if (i % 2 === 0) {
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
    //const disableAutoSkip = window.innerWidth <= 416 && count % 2 === 0 && count > 13;
    return (
      <Line
        data={{
          labels: generateLabels(),
          datasets: [generateLineData()]
        }}
        options={{
          responsive: true,
          aspectRatio: 1,
          layout: {
          },
          scales: {
            yAxis: {
              beginAtZero: false,
              grid: {
                borderColor: "white",
                color: "white"
              },
              ticks: {
                font: {
                  family: "consolas"
                },
                color: "white",
                callback: (val,i,vals) => {
                  if(val >= 10000)
                  {
                    return (Number(val) / 1000).toFixed(0) + "k"
                  } else {
                    return val;
                  }
                }
              }
            },
            xAxis: {
              grid: {
                borderColor: "white",
                color: "white"
              },
              ticks: {
                color: "white",
                font: {
                  family: "consolas",
                },
                autoSkip: false
              }
            }
          }
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
        end = 19;
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
      <div style={{ display: props.visible ? undefined : "none"}} className={styles.container}>
        <div className={styles["chart-area"]}>
          {calculations.length !== 0 && renderLineChart()}
        </div>
        {renderControls()}
      </div>
    );
  }
  return render();
}