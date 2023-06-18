import {
  ChartDataset,
  ScatterDataPoint,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Chart,
  ChartData,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import moment, { Moment } from "moment";
import React, { useEffect, useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import styles from "../styles/Modeler.module.css";
import { CalculationResult } from "../Processing/Managers/CalculationsManager";
import { CalculationTools } from "../Utilities/CalculationTools";
import { TellerManager } from "../Processing/Managers/TellerManager";
import { MultiSelect } from "./Inputs/MultiSelect";
import { TransactionData } from "../APIs/TellerAPI";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
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

enum ModelerMode {
  Growth,
  SpendingByMonth,
  SpendingByCategory
}

namespace ModelerMode {
  export function toString(mode: ModelerMode) {
    switch (mode) {
      case ModelerMode.Growth:
        return "Growth";
      case ModelerMode.SpendingByMonth:
        return "Spending by month";
      case ModelerMode.SpendingByCategory:
        return "Spending by category";
    }
  }
}

interface IModelerProps {
  visible: boolean;
}

export const Modeler: React.FC<IModelerProps> = (props) => {

  // Growth Chart
  const [growthChartresolution, setResolution] = useState(ModelerResolution.Weeks);
  const [growthChartNodeCount, setCount] = useState(5);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  // Spending By Month Chart
  const [sbmChartMonthsCount, setSbmChartMonthsCount] = useState(4);
  const [sbmChartCategories, setSbmChartCategories] = useState(TellerManager.categoryNamesNotIgnored);
  const [sbmTransactions, setSbmTransactions] = useState(calculateSpendingByMonthTransactions());
  // Spending by category chart
  const [sbcChartMonth, setSbcChartMonth] = useState(moment().format('YYYY-MM'));
  const [sbcChartCategories, setSbcChartCategories] = useState(TellerManager.categoryNamesNotIgnored);
  const [sbcTransactions, setSbcTransactions] = useState(calculateSpendingByCategoryTransactions());
  //TODO: Display Unrealized
  //TODO: Add estimated stock growth - do this via a new anticipated growth field on investmetns. 
  //Allow for zero value investments.
  //TODO: add different chart types
  const [mode, setMode] = useState(ModelerMode.Growth);

  useEffect(() => {
    fetchData().then(data => {
      setCalculations(data);
    });
  }, [growthChartresolution, growthChartNodeCount, props.visible]);

  useEffect(() => {
    setSbmTransactions(calculateSpendingByMonthTransactions());
  }, [sbmChartCategories, sbmChartMonthsCount, props.visible]);

  useEffect(() => {
    setSbcTransactions(calculateSpendingByCategoryTransactions());
  }, [sbcChartCategories, sbcChartMonth, props.visible]);

  useEffect(() => {
    TellerManager.ontransactioncategorized.addListener(onTransactionsCategorized);
    return () => {
      TellerManager.ontransactioncategorized.removeListener(onTransactionsCategorized);
    }
  }, []);

  async function fetchData() {
    const today = moment();
    const result = [await CalculationTools.requestCalculations(today, today)];
    switch (growthChartresolution) {
      case ModelerResolution.Days:
        {
          const curDay = today.clone();
          for (let i = 0; i < growthChartNodeCount; i++) {
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
          for (let i = 0; i < growthChartNodeCount; i++) {
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
          for (let i = 0; i < growthChartNodeCount; i++) {
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
          for (let i = 0; i < growthChartNodeCount * 2; i++) {
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

  function onTransactionsCategorized() {
    setSbmTransactions(calculateSpendingByMonthTransactions());
    setSbcTransactions(calculateSpendingByCategoryTransactions());
  }

  // GROWTH CHART

  function handleGrowthResolutionChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(event.currentTarget.value) as ModelerResolution;
    setResolution(value);
    setCount(ModelerResolution.getDefaultCount(value));
  }

  function handleGrowthNodeCountChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(event.currentTarget.value);
    setCount(value);
  }

  function generateGrowthLabels(): string[] {
    const today = moment();
    const result: string[] = [];
    switch (growthChartresolution) {
      case ModelerResolution.Days:
        {
          const curDay = today.clone();
          for (let i = 0; i < growthChartNodeCount; i++) {
            result.push(curDay.format('M/D'));
            curDay.add(1, 'day');
          }
        }
        break;
      case ModelerResolution.Weeks:
        {
          const curDay = today.clone().startOf('week');
          for (let i = 0; i < growthChartNodeCount; i++) {
            result.push(curDay.format('M/D'));
            curDay.add(1, 'week');
          }
        }
        break;
      case ModelerResolution.Months:
        {
          const curDay = today.clone().startOf('month');
          for (let i = 0; i < growthChartNodeCount; i++) {
            result.push(curDay.format('MMM') + ".");
            curDay.add(1, 'month');
          }
        }
        break;
      case ModelerResolution.Years:
        {
          const pastHalfYear = today.month() >= 5; //months are zero indexed lol
          const intervals = growthChartNodeCount * 2;
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

  function generateGrowthLineData(): ChartDataset<"line", (number | ScatterDataPoint | null)[]> {
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

  function renderGrowthChart() {
    //const disableAutoSkip = window.innerWidth <= 416 && count % 2 === 0 && count > 13;
    return (
      <Line
        data={{
          labels: generateGrowthLabels(),
          datasets: [generateGrowthLineData()]
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
                color: "white"
              },
              ticks: {
                font: {
                  family: "consolas"
                },
                color: "white",
                callback: (val, i, vals) => {
                  if (Number(val) >= 10000) {
                    return (Number(val) / 1000).toFixed(0) + "k"
                  } else {
                    return val;
                  }
                }
              }
            },
            xAxis: {
              grid: {
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

  function generateGrowthNodeOptions(): JSX.Element[] {
    const elements: JSX.Element[] = [];
    let start = 0;
    let end = 0;
    switch (growthChartresolution) {
      case ModelerResolution.Days:
        start = 5;
        end = 14;
        break;
      case ModelerResolution.Weeks:
        start = 3;
        end = 18;
        break;
      case ModelerResolution.Months:
        start = 4;
        end = 18;
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

  function renderGrowthControls() {
    return (
      <>
        <InputGroup className="mb-3">
          <InputGroup.Text>Resolution</InputGroup.Text>
          <Form.Select
            onChange={handleGrowthResolutionChanged}
            value={growthChartresolution}
          >
            <option value={ModelerResolution.Days}>Days</option>
            <option value={ModelerResolution.Weeks}>Weeks</option>
            <option value={ModelerResolution.Months}>Months</option>
            <option value={ModelerResolution.Years}>Years</option>
          </Form.Select>
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text>Nodes</InputGroup.Text>
          <Form.Select
            onChange={handleGrowthNodeCountChanged}
            value={growthChartNodeCount}
          >
            {generateGrowthNodeOptions()}
          </Form.Select>
        </InputGroup>
      </>
    )
  }

  // SPENDING BY MONTH

  function calculateSpendingByMonthTransactions() {
    const today = moment().endOf('day');
    let start = today.clone().startOf('month').subtract(sbmChartMonthsCount - 1, 'months');
    let transactions: [TransactionData, Moment][] = TellerManager.getTransactions()
      .map(t => [t, moment(t.date)]);
    transactions = transactions.filter(kvp => {
      const [t, date] = kvp;
      const category = TellerManager.getTransactionCategory(t.id);
      return date.isBetween(start, today) && category && sbmChartCategories.includes(category);
    }).sort((a, b) => {
      const [, aDate] = a;
      const [, bDate] = b;
      return aDate.valueOf() - bDate.valueOf();
    });
    return transactions;
  }

  function handleSbmChartCategoriesChanged(categories: string[]) {
    setSbmChartCategories(categories);
  }
  function handleSbmChartMonthsCountChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    setSbmChartMonthsCount(Number(event.target.value));
  }

  function generateSpendingByMonthData(): ChartData<"bar", (number | [number, number] | null)[]> {
    //Filter the dates to what is between
    let endOfCurrentMonth = moment().endOf('month').subtract(sbmChartMonthsCount - 1, 'months');
    const data: number[] = [];
    let index = 0;
    for (const [t, date] of sbmTransactions) {
      while (date.isAfter(endOfCurrentMonth)) {
        endOfCurrentMonth = endOfCurrentMonth.add(1, 'month');
        endOfCurrentMonth.endOf('month');
        index++;
      }
      if (!data[index]) {
        data[index] = 0;
      }
      // Spending is usually negative so subtract it.
      let value = t.amount;
      const account = TellerManager.getAccount(t.accountId);
      if (account) {
        value = account.type === 'credit' ? value *= -1 : value;
      }
      data[index] -= value;
    }
    return {
      labels: generateSpendingByMonthLabels(),
      datasets: [{
        label: 'data',
        data: data,
        backgroundColor: "#3f98f3",
        borderColor: "#3f98f3",
        xAxisID: "xAxis",
        yAxisID: "yAxis"
      }]
    }
  }

  function generateSpendingByMonthLabels(): string[] {
    const months = [];
    let today = moment().startOf('month');
    let monthsRemaining = sbmChartMonthsCount;
    while (monthsRemaining > 0) {
      months.push(today.format('MMM `YY'));
      today.subtract(1, 'month');
      monthsRemaining--;
    }
    return months.reverse();
  }

  function renderSpendingByMonthChart() {
    return (
      <Bar
        data={generateSpendingByMonthData()}
      />
    )
  }

  function generateSbmMonthsOptions() {
    const nodes: JSX.Element[] = [];
    for (let i = 1; i <= 12; i++) {
      nodes.push(
        <option key={i} value={i}>{i}</option>
      );
    }
    return nodes;
  }


  function renderSpendingByMonthControls() {
    return (
      <>
        <InputGroup className="mb-3">
          <InputGroup.Text>Months</InputGroup.Text>
          <Form.Select
            onChange={handleSbmChartMonthsCountChanged}
            value={sbmChartMonthsCount}
          >
            {generateSbmMonthsOptions()}
          </Form.Select>
        </InputGroup>
        <MultiSelect
          variant="secondary"
          className={styles['category-select']}
          onValuesChanged={handleSbmChartCategoriesChanged}
          values={TellerManager.categoryNamesNotIgnored}
          title="Categories"
          selectedValues={sbmChartCategories} />
      </>
    )
  }

  // SPENDING BY CATEGORY

  function calculateSpendingByCategoryTransactions() {
    let start = moment(sbcChartMonth);
    let end = start.clone().endOf('month');
    let transactions: [TransactionData, Moment][] = TellerManager.getTransactions()
      .map(t => [t, moment(t.date)]);
    transactions = transactions.filter(kvp => {
      const [t, date] = kvp;
      const category = TellerManager.getTransactionCategory(t.id);
      return date.isBetween(start, end) && category && sbcChartCategories.includes(category);
    }).sort((a, b) => {
      const [, aDate] = a;
      const [, bDate] = b;
      return aDate.valueOf() - bDate.valueOf();
    });
    console.log(transactions);
    return transactions;
  }

  function handleSbcChartCategoriesChanged(categories: string[]) {
    setSbcChartCategories(categories);
  }

  function handleSbcMonthChanged(event: React.ChangeEvent<HTMLInputElement>) {
    setSbcChartMonth(event.target.value);
  }

  function generateSpendingByCategoryData(): ChartData<"doughnut", number[], string> {
    const data: Map<string, number> = new Map();
    for (const [transaction,] of sbcTransactions) {
      const categoryName = TellerManager.getTransactionCategory(transaction.id) ?? 'Uncategorized';
      if (!data.has(categoryName)) {
        data.set(categoryName, 0);
      }
      data.set(categoryName, data.get(categoryName)! + transaction.amount);
    }
    const colors = palette('cb-Pastel1', data.size).map((str: string) => `#${str}`);
    const result = {
      labels: [...data.keys()],
      datasets: [
        {
          label: 'data',
          data: [...data.values()],
          backgroundColor: colors,
          hoverOffset: 0,
          borderColor: colors,
        }
      ]
    };
    console.log(result)
    return result;
  }

  function renderSpendingByCategoryChart() {
    return (
      <div className={styles['pie-chart-container']}>
        <Doughnut 
        data={generateSpendingByCategoryData()}
        options={{
          responsive: true
        }}
        />
      </div>
    )
  }

  function renderSpendingByCateogryControls() {
    return (
      <>
        <InputGroup className="mb-3">
          <InputGroup.Text>Month</InputGroup.Text>
          <input
            type="month"
            className={styles["month-picker"]}
            onChange={handleSbcMonthChanged}
            value={sbcChartMonth}
            onClick={(e) => {e.currentTarget.showPicker(); e.stopPropagation();}}
          />
        </InputGroup>
        <MultiSelect
          variant="secondary"
          className={styles['category-select']}
          onValuesChanged={handleSbcChartCategoriesChanged}
          values={TellerManager.categoryNamesNotIgnored}
          title="Categories"
          selectedValues={sbcChartCategories} />
      </>
    );
  }

  // GENERIC

  function handleModeChanged(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(event.currentTarget.value);
    setMode(value as ModelerMode);
  }



  function renderControls() {
    switch (mode) {
      case ModelerMode.Growth:
        return renderGrowthControls();
      case ModelerMode.SpendingByCategory:
        return renderSpendingByCateogryControls();
      case ModelerMode.SpendingByMonth:
        return renderSpendingByMonthControls();
    }

  }

  function renderChart() {
    switch (mode) {
      case ModelerMode.Growth:
        return calculations.length !== 0 ? renderGrowthChart() : null;
      case ModelerMode.SpendingByCategory:
        return renderSpendingByCategoryChart();
      case ModelerMode.SpendingByMonth:
        return renderSpendingByMonthChart();
    }
  }

  function render() {
    return (
      <div style={{ display: props.visible ? undefined : "none" }} className={styles.container}>
        <div>
          <InputGroup className="mb-3">
            <InputGroup.Text>Mode</InputGroup.Text>
            <Form.Select
              onChange={handleModeChanged}
              value={mode}
            >
              <option value={ModelerMode.Growth}>{ModelerMode.toString(ModelerMode.Growth)}</option>
              <option value={ModelerMode.SpendingByCategory}>{ModelerMode.toString(ModelerMode.SpendingByCategory)}</option>
              <option value={ModelerMode.SpendingByMonth}>{ModelerMode.toString(ModelerMode.SpendingByMonth)}</option>
            </Form.Select>
          </InputGroup>
        </div>
        <div>
          {renderControls()}
        </div>
        <div className={styles["chart-area"]}>
          {renderChart()}
        </div>
      </div>
    );
  }
  return render();
}