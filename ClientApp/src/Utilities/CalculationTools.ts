import moment from "moment";
import { Moment } from "moment";
import { FrequencyType } from "../Processing/Enums/FrequencyType";
import { IncomeFrequency } from "../Processing/Enums/IncomeFrequency";
import { AppStateManager } from "../Processing/Managers/AppStateManager";
import { CalculationResult, InvestmentCalculation, ResultPair } from "../Processing/Managers/CalculationsManager";
import { InvestmentManager } from "../Processing/Managers/InvestmentManger";
import { TellerManager } from "../Processing/Managers/TellerManager";
import { Account } from "../Processing/Models/Account";
import { Bill } from "../Processing/Models/Bill";
import { Debt } from "../Processing/Models/Debt";
import { IncomeSource } from "../Processing/Models/IncomeSource";
import { Investment } from "../Processing/Models/Investment";
import { PaymentSchedule } from "../Processing/Models/ScheduledPayment";
import { VestSchedule } from "../Processing/Models/VestSchedule";
import { TestLogger } from "./TestLogger";


export type IncomeResult = { amount: number, periods: number };
export type VestResult = {
  amount: number,
  shares: number
}

export type QuarterNumber = 1 | 2 | 3 | 4;

export namespace CalculationTools {

  export async function requestCalculations(start: Moment, end: Moment): Promise<CalculationResult> {
    //skip today for bills.
    const billStart = start.clone().add(1, 'day');
    let debtCost = calculateDebts(AppStateManager.debts);
    let accountValue = calculateAccountValue(AppStateManager.accounts);
    let allBillCost = await calculateAllBillsCost(billStart, end, AppStateManager.bills);
    let unavoidableBillCost = await calculateAllBillsCost(billStart, end, [...AppStateManager.bills].filter(bill => bill.unavoidable));
    let incomeValue = await calculateTotalIncome(start, end, AppStateManager.incomeSources);
    let investmentValue = calculateTotalInvestmentValue(start, end, AppStateManager.investments);
    let scheduledpaymentsvalue = calculateTotalForScheduledPayments(start, end, AppStateManager.paymentSchedules);
    let stockScheduleValue = await calculateTotalForScheduledStockVests(start, end, AppStateManager.vestSchedules);
    let linkedAccountValue = TellerManager.getTotalValueOfAccounts();

    let results: CalculationResult = {
      billResults: {
        allBills: allBillCost,
        unavoidableBills: unavoidableBillCost
      },
      debtTotal: debtCost,
      accountTotal: accountValue,
      incomeResults: incomeValue,
      investmentResults: investmentValue,
      scheduledPaymentsResult: scheduledpaymentsvalue,
      scheduledVestsResult: stockScheduleValue,
      linkedAccountTotal: linkedAccountValue
    }
    return results;
  }

  export function calculateTotal(calcs: CalculationResult, displayUnrealized: boolean) {

    const investmentsWithUnrealized = calcs.investmentResults.totalValue;
    let investmentsBaseValue = 0;
    if(calcs.investmentResults.totalCostBasis > calcs.investmentResults.totalValue)
    {
      investmentsBaseValue = calcs.investmentResults.totalValue;
    } else {
      investmentsBaseValue = calcs.investmentResults.totalCostBasis;
    }

    const totals =
      calcs.accountTotal +
      calcs.linkedAccountTotal.accountsValue -
      calcs.linkedAccountTotal.debt +
      calcs.incomeResults[1] -
      calcs.debtTotal -
      calcs.billResults.allBills[1] +
      calcs.scheduledVestsResult[1] +
      calcs.scheduledPaymentsResult[1] +
      (displayUnrealized ? investmentsWithUnrealized : investmentsBaseValue) - calcs.investmentResults.totalInterestOwed
    return totals;
  }

  export function calculateDebts(debts: Iterable<Debt>) {
    let result = 0;
    for (let debt of debts) {
      result += debt.amount;
    }
    return result;
  }

  export function calculateAccountValue(accounts: Iterable<Account>) {
    let result = 0;
    for (let account of accounts) {
      result += account.amount;
    }
    return result;
  }

  export function calculateTotalForScheduledPayments(start: Moment, end: Moment, schedules: Iterable<PaymentSchedule>): ResultPair<PaymentSchedule> {
    let sum = 0;
    const results = new Map<PaymentSchedule, number>();
    for (let schedule of schedules) {
      let scheduleSum = 0;
      for (let payment of schedule.payments) {
        if (payment.date.isBetween(start, end)) {
          scheduleSum += payment.amount;
        }
      }
      results.set(schedule, scheduleSum);
      sum += scheduleSum;
    }
    return [results, sum];
  }

  export async function calculateTotalForScheduledStockVests(start: Moment, end: Moment, schedules: Iterable<VestSchedule>): Promise<ResultPair<VestSchedule, VestResult>> {
    let sum = 0;
    const results = new Map<VestSchedule, VestResult>();
    for (let schedule of schedules) {
      let scheduleSum = 0;
      let shares = 0;
      for (let vest of schedule.vests) {
        if (vest.date.isBetween(start, end)) {
          const symbolValue = (await InvestmentManager.getStockPriceForSymbol(vest.symbol)) ?? 0;
          scheduleSum += (vest.shares * symbolValue * (1 - vest.taxPercentage));
          shares += vest.shares;
        }
      }
      results.set(schedule, {
        amount: scheduleSum,
        shares: shares
      });
      sum += scheduleSum;
    }
    return [results, sum];
  }

  export function calculateTotalInvestmentValue(start: Moment, end: Moment, investments: Iterable<Investment>): InvestmentCalculation {
    let value = 0;
    let marginInterest = 0;
    let costBasis = 0;
    let totalUnrealizedLosses = 0;
    // console.log(start, end);
    const daysBetween = Math.abs(start.diff(end, 'day'));
    for (let investment of investments) {
      const investmentValue = InvestmentManager.getExistingCalculation(investment.id) ?? 0;
      value += investmentValue
      const margin = ((((investment.marginInterestRate / 100) * investment.marginDebt) / 360) * daysBetween);
      marginInterest += margin;
      const investmentCostBasis = (investment.costBasisPerShare * investment.shares) - investment.marginDebt;
      costBasis += investmentCostBasis;
      totalUnrealizedLosses += (investmentValue - investmentCostBasis);
    }
    const result: InvestmentCalculation = {
      totalValue: value,
      totalInterestOwed: marginInterest,
      totalCostBasis: costBasis,
      totalUnrealizedLosses: Math.abs(totalUnrealizedLosses)
    };
    return result;
  }

  export async function calculateTotalIncome(start: Moment, end: Moment, incomeSources: Iterable<IncomeSource>): Promise<ResultPair<IncomeSource, IncomeResult>> {
    let result = 0;
    let promises: Promise<[IncomeSource, number, number]>[] = [];
    for (let source of incomeSources) {
      promises.push(calculateTotalForIncomeSource(source, start.clone(), end.clone()));
    }
    let incomeMap = new Map<IncomeSource, IncomeResult>();
    let results = await Promise.all(promises);
    for (let [source, amount, periods] of results) {
      if (amount > 0) {
        incomeMap.set(source, {
          amount,
          periods
        });
      }
      result += amount;
    }
    return [incomeMap, result];
  }

  export async function calculateAllBillsCost(start: Moment, end: Moment, bills: Iterable<Bill>): Promise<ResultPair<Bill>> {
    let value = 0;
    let promises: Promise<[Bill, number]>[] = [];
    for (let bill of bills) {
      promises.push(calculateCostForBill(bill, start, end));
    }
    let results = await Promise.all(promises);
    let billMap = new Map<Bill, number>();
    for (let [bill, cost] of results) {
      if (cost > 0) {
        billMap.set(bill, cost);
      }
      value += cost;
    }
    return [billMap, value];
  }

  async function calculateCostForBill(bill: Bill, start: Moment, end: Moment): Promise<[Bill, number]> {
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
    return [bill, value];
  }

  export async function calculateTotalForIncomeSource(source: IncomeSource, start: Moment, end: Moment): Promise<[IncomeSource, number, number]> {
    let currentDate = start.clone();
    let value = 0;
    let payPeriods = 0;
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
          payPeriods = weeks;
        }
        break;
      case IncomeFrequency.Biweekly:
        {
          const even = paysOnEvenWeeks(source.startDate, currentDate);
          const payDow = 5; //Friday;
          let startDow = currentDate.weekday();
          let endDow = end.weekday();
          let weekNum = currentDate.week();
          let weeks = 0;
          const startWeek = currentDate.clone().startOf('week');
          const endWeek = end.clone().startOf('week');
          const weekDiff = endWeek.diff(startWeek, 'weeks') + 1;
          const isEvenWeek = weekNum % 2 === 0;
          const isPayWeek = even ? isEvenWeek : !isEvenWeek;
          const endIsPayWeek = isPayWeek ? weekDiff % 2 !== 0 : weekDiff % 2 === 0;
          //if there is an even number of weeks, pay weeks and non pay weeks will be the same amount
          if (weekDiff % 2 === 0) {
            weeks = Math.round(weekDiff / 2); // remove rounding errors.
          }
          //If it's odd, then there will be more depending on if the pay is in the start week or not. 
          else {
            weeks = weekDiff / 2;

            if (isPayWeek) {
              weeks = Math.ceil(weeks);
            } else {
              weeks = Math.floor(weeks);
            }
          }
          //Handle first and last week
          if (startDow >= payDow && isPayWeek) {
            weeks--;
          }
          if (endDow < payDow && endIsPayWeek) {
            weeks--;
          }
          payPeriods = weeks;
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
              paydayA = calculatePaydayOffWeekend(paydayA);
              paydayB = calculatePaydayOffWeekend(paydayB);
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
              firstMonthPayDayA = calculatePaydayOffWeekend(firstMonthPayDayA);
              firstMonthPayDayB = calculatePaydayOffWeekend(firstMonthPayDayB);
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
              lastMonthPayDayA = calculatePaydayOffWeekend(lastMonthPayDayA);
              lastMonthPayDayB = calculatePaydayOffWeekend(lastMonthPayDayB);
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
            payPeriods = totalPaydays;
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
          payPeriods = timesOccured;
        }
        break;
      case IncomeFrequency.Quarterly:
        let timesOccured = 0;
        //If the start and end are in the same year
        if (currentDate.year() === end.year()) {

        } else {
          timesOccured += getQuarterEndsLeftInYear(currentDate);
          timesOccured += getQuarterEndsPassedInYear(end);
          let yearsBetween = end.year() - currentDate.year();
          timesOccured += ((yearsBetween - 1) * 4);
        }
        payPeriods = timesOccured;
        value = timesOccured * source.amount;
        break;
      case IncomeFrequency.Anually:
        break;
    }
    return [source, value, payPeriods];
  }

  //HELPER Functions

  function paysOnEvenWeeks(baseDate: Moment, currentDate: Moment): boolean {
    const baseEven = baseDate.week() % 2 === 0;
    const baseYear = baseDate.year();
    const currentYear = currentDate.year();
    const currentYearSameAsBase = (Math.abs(currentYear - baseYear) % 2 === 0)
    return currentYearSameAsBase ? baseEven : !baseEven;
  }

  function getCurrentQuarter(date: Moment): QuarterNumber {
    let result: QuarterNumber
    date = date.clone().startOf('day');
    let year = date.year();
    let q1 = getQuarterEndDate(year, 1);
    let q2 = getQuarterEndDate(year, 2);
    let q3 = getQuarterEndDate(year, 3);
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

  function getQuarterEndsLeftInYear(date: Moment) {
    date = date.clone().startOf('day');
    let currentQuarter = getCurrentQuarter(date);
    let quarterEndDate = getQuarterEndDate(date.year(), currentQuarter);
    //Total Quarters - the current quarter since that one can end still
    let result = 4 - currentQuarter + 1;
    //If the date is the end of the quarter it doesn't count
    if (quarterEndDate.isSame(date)) {
      result--;
    }
    return result;
  }

  function getQuarterEndsPassedInYear(date: Moment) {
    let remaining = getQuarterEndsLeftInYear(date);
    return 4 - remaining;
  }

  function getQuarterEndDate(year: number, quarter: QuarterNumber) {
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

  function calculatePaydayOffWeekend(initalDay: Moment) {
    let payDay = initalDay.clone();
    let payDow = payDay.weekday();
    if (payDow === 0) {
      payDay.subtract(2, 'days');
    } else if (payDow === 6) {
      payDay.subtract(1, 'days');
    }
    return payDay;
  }
}