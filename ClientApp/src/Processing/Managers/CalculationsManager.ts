import moment, { Moment } from "moment";
import { Action } from "../../Utilities/Action";
import { TestLogger } from "../../Utilities/TestLogger";
import { FrequencyType } from "../Enums/FrequencyType";
import { IncomeFrequency } from "../Enums/IncomeFrequency";
import { Account } from "../Models/Account";
import { Bill } from "../Models/Bill";
import { Debt } from "../Models/Debt";
import { IncomeSource } from "../Models/IncomeSource";
import { AppStateManager } from "./AppStateManager";

export interface CalculationResult {
  billTotal: number;
  debtTotal: number;
  accountTotal: number;
  incomeTotal: number;
}

type QuarterNumber = 1 | 2 | 3 | 4;

class CalculationsManager {

  public readonly onresultscalculated: Action<CalculationResult>;

  private _endDate: Moment;

  constructor() {
    this._endDate = moment().add(1, 'days').startOf('day');
    this.onresultscalculated = new Action();
    this.handleUpdate = this.handleUpdate.bind(this);
    AppStateManager.onbillsupdated.addListener(this.handleUpdate);
    AppStateManager.onaccountsupdated.addListener(this.handleUpdate);
    AppStateManager.ondebtsupdated.addListener(this.handleUpdate);
    AppStateManager.onincomesourcesupdated.addListener(this.handleUpdate);
  }

  get endDate() {
    return this._endDate;
  }

  set endDate(date: Moment) {
    this._endDate = date;
    this.handleUpdate();
  }

  public async requestCalculations(): Promise<CalculationResult> {
    const start = moment().startOf('day');
    const end = this.endDate.clone();
    let debtCost = this.calculateDebts(AppStateManager.debts);
    let accountValue = this.calculateAccountValue(AppStateManager.accounts);
    let billCost = await this.calculateAllBillsCost(start, end, AppStateManager.bills);
    let incomeValue = await this.calculateTotalIncome(start, end, AppStateManager.incomeSources);

    let results: CalculationResult = {
      billTotal: billCost,
      debtTotal: debtCost,
      accountTotal: accountValue,
      incomeTotal: incomeValue
    }
    return results;
  }

  private async handleUpdate() {
    let results = await this.requestCalculations();
    this.onresultscalculated.invoke(results);
  }

  private calculateDebts(debts: IterableIterator<Debt>) {
    let result = 0;
    for (let debt of debts) {
      result += debt.amount;
    }
    return result;
  }

  private calculateAccountValue(accounts: IterableIterator<Account>) {
    let result = 0;
    for (let account of accounts) {
      result += account.amount;
    }
    return result;
  }

  public async calculateTotalIncome(start: Moment, end: Moment, incomeSources: IterableIterator<IncomeSource>) {
    let result = 0;
    var promises: Promise<number>[] = [];
    for (let source of incomeSources) {
      promises.push(this.calculateTotalForIncomeSource(source, start, end));
    }
    let results = await Promise.all(promises);
    for (let value of results) {
      result += value;
    }
    return result;
  }

  private async calculateTotalForIncomeSource(source: IncomeSource, start: Moment, end: Moment) {
    let currentDate = start.clone();
    let value = 0;
    switch (source.frequencyType) {
      case IncomeFrequency.Weekly:
        {
          let payDow = 5; //Friday;
          let startDow = currentDate.weekday();
          let endDow = end.weekday();
          let weeks = Math.abs(currentDate.diff(end, 'weeks'));
          if (startDow >= payDow) {
            weeks--;
          }
          if (endDow > payDow) {
            weeks++;
          }
          if (startDow > endDow) {
            weeks++;
          }
          value = weeks * source.amount;
        }
        break;
      case IncomeFrequency.BiWeeklyEven:
      case IncomeFrequency.BiWeeklyOdd:
        {
          const even = IncomeFrequency.BiWeeklyEven === source.frequencyType ? true : false;
          let payDow = 5; //Friday;
          let startDow = currentDate.weekday();
          let endDow = end.weekday();
          let weeks = Math.abs(currentDate.diff(end, 'weeks'));
          weeks /= 2;
          const startIsInPayWeek = (currentDate.week() % 2 === 0) === even
          const paidThisWeek = startIsInPayWeek && (startDow < payDow);
          const endIsInAPayWeek = ((end.week() % 2 === 0) === even)
          const paidInFinalWeek = endIsInAPayWeek && (endDow > payDow);
          if (paidInFinalWeek && endIsInAPayWeek) {
            weeks++;
          }
          if (!paidThisWeek && startIsInPayWeek) {
            weeks--;
          }
          if (paidThisWeek && startDow > endDow) {
            weeks++;
          }
          if (paidThisWeek && startDow === 5) {
            weeks--;
          }
          value = weeks * source.amount;
        }
        break;
      case IncomeFrequency.SemiMonthlyMiddleOM:
      case IncomeFrequency.SemiMonthlyStartOM:
        {
          let firstBetweenDay = currentDate.clone().startOf('month').add(1, 'month');
          let lastBetweenday = end.clone().startOf('month').subtract(1, 'day');
          let betweenMonths = Math.round(Math.abs(firstBetweenDay.diff(lastBetweenday, 'months', true)));
          let totalPaydays = 2 * betweenMonths;
          //Calculations for start and end months
          let isMiddleOfMonthStart = source.frequencyType === IncomeFrequency.SemiMonthlyMiddleOM;
          //The dates are in the same month, process differently
          if (currentDate.month() === end.month() && currentDate.year() === end.year()) {
            let paydays = 0;
            let paydayA = (isMiddleOfMonthStart ?
              currentDate.clone().date(15) :
              currentDate.clone().date(1)
            ).startOf('day');
            let paydayB = (isMiddleOfMonthStart ?
              currentDate.clone().endOf('month') :
              currentDate.clone().date(15)
            ).startOf('day');
            if (!source.paysOnWeekends) {
              paydayA = this.calculatePaydayOffWeekend(paydayA);
              paydayB = this.calculatePaydayOffWeekend(paydayB);
            }
            if (currentDate.isBefore(paydayA)) {
              if (end.isSameOrAfter(paydayB)) {
                TestLogger.log("Adding 2 because end is same or after paydayB")
                paydays += 2;
              } else if (end.isSameOrAfter(paydayA)) {
                paydays++;
                TestLogger.log("Adding 1 because end is same or after paydayA")
              }
            } else if (currentDate.isBefore(paydayB)) {
              if (end.isSameOrAfter(paydayB)) {
                paydays++;
                TestLogger.log("Adding 1 because end is same or after paydayB but start is same or after paydayA")
              }
            }
            value = paydays * source.amount;
          } else {
            let firstMonthPayDayA = (isMiddleOfMonthStart ?
              currentDate.clone().date(15) :
              currentDate.clone().date(1)
            ).startOf('day');
            let firstMonthPayDayB = (isMiddleOfMonthStart ?
              currentDate.clone().endOf('month') :
              currentDate.clone().date(15)
            ).startOf('day');
            if (!source.paysOnWeekends) {
              firstMonthPayDayA = this.calculatePaydayOffWeekend(firstMonthPayDayA);
              firstMonthPayDayB = this.calculatePaydayOffWeekend(firstMonthPayDayB);
            }

            let lastMonthPayDayA = (isMiddleOfMonthStart ?
              end.clone().date(15) :
              end.clone().date(1)
            ).startOf('day');
            let lastMonthPayDayB = (isMiddleOfMonthStart ?
              end.clone().endOf('month') :
              end.clone().date(15)
            ).startOf('day');
            if (!source.paysOnWeekends) {
              lastMonthPayDayA = this.calculatePaydayOffWeekend(lastMonthPayDayA);
              lastMonthPayDayB = this.calculatePaydayOffWeekend(lastMonthPayDayB);
            }
            if (currentDate.isBefore(firstMonthPayDayA)) {
              totalPaydays += 2;
            } else if (currentDate.isBefore(firstMonthPayDayB)) {
              totalPaydays++;
            }
            if (end.isSameOrAfter(lastMonthPayDayB)) {
              totalPaydays += 2;
            } else if (end.isSameOrAfter(lastMonthPayDayA)) {
              totalPaydays++;
            }
            value = totalPaydays * source.amount;
          }
        }
        break;
      case IncomeFrequency.Monthly:

        if (currentDate.month() === end.month() && currentDate.year() === end.year()) {
          let currentDayOfMonth = currentDate.date();
          if (currentDayOfMonth < source.dayOfMonth) {
            value = source.amount;
          }
        } else {
          let timesOccured = 0;
          let currentDayOfMonth = currentDate.date();
          if (currentDayOfMonth < source.dayOfMonth) {
            timesOccured++;
          }
          currentDate = currentDate.add(1, 'month').startOf('month');
          let endDayOfMonth = end.date();
          if (endDayOfMonth >= source.dayOfMonth) {
            timesOccured++;
          }

          end = end.startOf('month')
          let monthsBetween = Math.abs(currentDate.diff(end, 'month'));
          timesOccured += monthsBetween;
          value = timesOccured * source.amount;
        }

        break;
      case IncomeFrequency.Quarterly:
        let timesOccured = 0;
        //If the start and end are in the same year
        if (currentDate.year() === end.year()) {

        } else {
          timesOccured += this.getQuarterEndsLeftInYear(currentDate);
          timesOccured += this.getQuarterEndsPassedInYear(end);
          let yearsBetween = end.year() - currentDate.year();
          timesOccured += ((yearsBetween - 1) * 4);
        }
        value = timesOccured * source.amount;
        break;
      case IncomeFrequency.Anually:
        break;
    }
    return value;
  }

  private getCurrentQuarter(date: Moment): QuarterNumber {
    let result: QuarterNumber
    date = date.clone().startOf('day');
    let year = date.year();
    let q1 = this.getQuarterEndDate(year, 1);
    let q2 = this.getQuarterEndDate(year, 2);
    let q3 = this.getQuarterEndDate(year, 3);
    if (date.isSameOrBefore(q1)) {
      result = 1;
    } else if (date.isSameOrBefore(q2)) {
      result = 2;
    } else if (date.isSameOrBefore(q3)) {
      result = 3;
    } else {
      result = 4;
    }
    return result;
  }

  private getQuarterEndsLeftInYear(date: Moment) {
    date = date.clone().startOf('day');
    let currentQuarter = this.getCurrentQuarter(date);
    let quarterEndDate = this.getQuarterEndDate(date.year(), currentQuarter);
    //Total Quarters - the current quarter since that one can end still
    let result = 4 - currentQuarter + 1;
    //If the date is the end of the quarter it doesn't count
    if (quarterEndDate.isSame(date)) {
      result--;
    }
    return result;
  }

  private getQuarterEndsPassedInYear(date: Moment) {
    let remaining = this.getQuarterEndsLeftInYear(date);
    return 4 - remaining;
  }

  private getQuarterEndDate(year: number, quarter: QuarterNumber) {
    let result: Moment;
    switch (quarter) {
      case 1:
        result = moment(`${year}-03-31`);
        break;
      case 2:
        result = moment(`${year}-06-30`);
        break;
      case 3:
        result = moment(`${year}-09-30`);
        break;
      case 4:
        result = moment(`${year}-12-31`);
        break;
    }
    return result.startOf('day');
  }

  private calculatePaydayOffWeekend(initalDay: Moment) {
    let payDay = initalDay.clone();
    let payDow = payDay.weekday();
    if (payDow === 0) {
      payDay.subtract(2, 'days');
    } else if (payDow === 6) {
      payDay.subtract(1, 'days');
    }
    return payDay;
  }

  public async calculateAllBillsCost(start: Moment, end: Moment, bills: IterableIterator<Bill>) {
    let value = 0;
    var promises: Promise<number>[] = [];
    for (let bill of bills) {
      promises.push(this.calculateCostForBill(bill, start, end));
    }
    let results = await Promise.all(promises);
    for (let cost of results) {
      value += cost;
    }
    return value;
  }

  private async calculateCostForBill(bill: Bill, start: Moment, end: Moment) {
    let currentDate = start.clone();
    if (currentDate.isBefore(bill.initialDate)) {
      currentDate = bill.initialDate.clone();
    } else if (currentDate.isAfter(bill.initialDate)) {
      //Move the start to the first bill date 
      let unit = FrequencyType.toMomentType(bill.frequencyType);
      let nextBillDate = bill.initialDate.clone().add(bill.frequency, unit);
      while (nextBillDate.isBefore(currentDate)) {
        nextBillDate.add(bill.frequency, unit);
      }
      currentDate = nextBillDate;
    }
    let value = 0;
    switch (bill.frequencyType) {
      case FrequencyType.Daily:

        //we already moved up to the next bill date
        if (currentDate.isAfter(end)) {
          value = 0;
        } else {
          let days = currentDate.diff(end, 'days', true);
          days = Math.round(Math.abs(days)) + 1;
          let multiplier = 0;
          let dividened = days / bill.frequency;
          if (bill.frequency % 2 === 1) {
            multiplier = Math.ceil(dividened);
          } else {
            multiplier = Math.floor(dividened)
          }
          value = multiplier * bill.amount;
        }

        break;
      case FrequencyType.Weekly:
        {
          let billDow = bill.initialDate.isoWeekday();
          let startDow = currentDate.isoWeekday();
          let endDow = end.isoWeekday();
          let timesOccured = 0;
          while (currentDate.isSameOrBefore(end)) {
            timesOccured++;
            currentDate.add(1, 'weeks');
          }
          if (startDow > endDow) {
            timesOccured++;
          }
          if (billDow < startDow) {
            timesOccured--;
          }
          if (billDow > endDow) {
            timesOccured--;
          }
          let multiplier = 0;
          if (bill.frequency % 2 === 1) {
            multiplier = Math.ceil(timesOccured / bill.frequency);
          } else {
            multiplier = Math.floor(timesOccured / bill.frequency);
          }
          value = multiplier * bill.amount;
        }
        break;
      case FrequencyType.Monthly:
        {
          let timesOccured = 0;
          while (currentDate.isSameOrBefore(end)) {
            timesOccured++;
            currentDate.add(1, 'months');
          }

          let multiplier = 0;
          if (bill.frequency % 2 === 1) {
            multiplier = Math.ceil(timesOccured / bill.frequency);
          } else {
            multiplier = Math.ceil(timesOccured / bill.frequency);
          }
          value = multiplier * bill.amount;
        }
        break;
      case FrequencyType.Anually:
        {
          let timesOccured = 0;
          while (currentDate.isSameOrBefore(end)) {
            timesOccured++;
            currentDate.add(1, 'years');
          }

          let multiplier = 0;
          if (bill.frequency % 2 === 1) {
            multiplier = Math.ceil(timesOccured / bill.frequency);
          } else {
            multiplier = Math.ceil(timesOccured / bill.frequency);
          }
          value = multiplier * bill.amount;
        }
        break;

    }
    return value;
  }
}

const instance = { instance: new CalculationsManager() }
export { instance as CalculationsManager }