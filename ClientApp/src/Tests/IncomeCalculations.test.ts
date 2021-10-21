import moment from 'moment';
import { IncomeFrequency } from '../Processing/Enums/IncomeFrequency';
import { CalculationsManager } from '../Processing/Managers/CalculationsManager';
import { IncomeSource } from '../Processing/Models/IncomeSource';

describe('Income Calc Weekly', () => {
  let options = {
    name: 'Sample Source',
    amount: 10,
    frequencyType: IncomeFrequency.Weekly,
    paysOnWeekends: false,
    dayOfMonth: -1
  };

  let sources = new Set<IncomeSource>();
  test('Start Just Before, End Just After', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-09-25"), sources.values()
    );
    expect(result).toEqual(40);
  });

  test('Start much Before, End Just After', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-08-28"), moment("2021-09-25"), sources.values()
    );
    expect(result).toEqual(40);
  });


  test('Start Just After, End Just After', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-04"), moment("2021-09-25"), sources.values()
    );
    expect(result).toEqual(30);
  });

  test('Start Just After, End Just Before', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-08-28"), moment("2021-09-23"), sources.values()
    );
    expect(result).toEqual(30);
  });
  test('Start Just After, End Much Before', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-08-28"), moment("2021-09-20"), sources.values()
    );
    expect(result).toEqual(30);
  });
});

describe('Income Calc Bi-Weekly', () => {
  let options = {
    name: 'Sample Source',
    amount: 10,
    frequencyType: IncomeFrequency.BiWeeklyOdd,
    paysOnWeekends: false,
    dayOfMonth: -1
  };

  let sources = new Set<IncomeSource>();

  test('Super Close days', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.BiWeeklyEven;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-09-02"), sources.values()
    );
    expect(result).toEqual(0);
  });

  test('Even w/ start in pay week', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.BiWeeklyEven;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-10-02"), sources.values()
    );
    expect(result).toEqual(30);
  });

  test('odd w/ Start in pay week', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-08"), moment("2021-10-09"), sources.values()
    );
    expect(result).toEqual(30);
  });

  test('Even w/ start not in pay week', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.BiWeeklyEven;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-08"), moment("2021-10-09"), sources.values()
    );
    expect(result).toEqual(20);
  });

  test('odd w/ Start not in pay week', async () => {
    sources.clear();
    sources.add(new IncomeSource(options));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-10-02"), sources.values()
    );
    expect(result).toEqual(20);
  });
});

describe('Income Calc Semi-Monthly', () => {
  let options = {
    name: 'Sample Source',
    amount: 10,
    frequencyType: IncomeFrequency.SemiMonthlyMiddleOM,
    paysOnWeekends: false,
    dayOfMonth: -1
  };

  let sources = new Set<IncomeSource>();
  test('Middle of Month, 1st of start last of end', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-12-31"), sources.values()
    );
    expect(result).toEqual(80);
  });

  test('Middle of Month, Miss First Check', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-16"), moment("2021-12-31"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Middle of Month, Miss Last Check', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-12-30"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Middle of Month, Miss 1 Check each side', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-16"), moment("2021-12-30"), sources.values()
    );
    expect(result).toEqual(60);
  });

  test('Start of Month, 1st of start last of end', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.SemiMonthlyStartOM
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-12-31"), sources.values()
    );
    expect(result).toEqual(80);
  });

  test('Start of Month, Miss First Check', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.SemiMonthlyStartOM
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-02"), moment("2021-12-31"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Start of Month, Miss Last Check', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.SemiMonthlyStartOM
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-01"), moment("2021-12-13"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Start of Month, Miss 1 check each side', async () => {
    sources.clear();
    let opts = { ...options };
    opts.frequencyType = IncomeFrequency.SemiMonthlyStartOM
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-02"), moment("2021-12-13"), sources.values()
    );
    expect(result).toEqual(60);
  });

  test('Weekend pushes before start', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2022-01-15"), moment("2022-03-31"), sources.values()
    );
    expect(result).toEqual(50);
  });

  test('Weekend pushes before start, pays on weekends', async () => {
    sources.clear();
    let opts = { ...options };
    opts.paysOnWeekends = true;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2022-01-01"), moment("2022-03-31"), sources.values()
    );
    expect(result).toEqual(60);
  });

  test('Weekend pushes to end', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-04-13"), moment("2021-08-13"), sources.values()
    );
    expect(result).toEqual(90);
  });

  test('Weekend pushes to end, but pays on weekends', async () => {
    sources.clear();
    let opts = { ...options };
    opts.paysOnWeekends = true;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-04-13"), moment("2021-08-13"), sources.values()
    );
    expect(result).toEqual(80);
  });

  test('Super Close Dates', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-03"), moment("2021-09-04"), sources.values()
    );
    expect(result).toEqual(0);
  });

  test('Dates in same month', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-09-03"), moment("2021-09-17"), sources.values()
    );
    expect(result).toEqual(10);
  });
});

describe('Income Calc Monthly', () => {
  let options = {
    name: 'Sample Source',
    amount: 10,
    frequencyType: IncomeFrequency.Monthly,
    paysOnWeekends: false,
    dayOfMonth: 15
  };

  let sources = new Set<IncomeSource>();
  test('Current Date after paycheck, end date after', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-16"), moment("2021-08-16"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Current Date before paycheck, end date after', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-14"), moment("2021-08-16"), sources.values()
    );
    expect(result).toEqual(80);
  });

  test('Current Date on paycheck, end date after', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-15"), moment("2021-08-16"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Current Date before paycheck, end date before', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-14"), moment("2021-08-14"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Current Date after paycheck, end date before', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-16"), moment("2021-08-14"), sources.values()
    );
    expect(result).toEqual(60);
  });

  test('Current Date on paycheck, end date before', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-15"), moment("2021-08-14"), sources.values()
    );
    expect(result).toEqual(60);
  });


  test('Current Date before paycheck, end date on', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-14"), moment("2021-08-15"), sources.values()
    );
    expect(result).toEqual(80);
  });

  test('Current Date on paycheck, end date on', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-15"), moment("2021-08-15"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('Current Date after paycheck, end date on', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-01-16"), moment("2021-08-15"), sources.values()
    );
    expect(result).toEqual(70);
  });

  test('In Same Month, start after', async () => {
    sources.clear();
    let opts = { ...options };
    opts.amount = 400;
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-10-20"), moment("2021-10-21"), sources.values()
    );
    expect(result).toEqual(0);
  });

  test('End before date next Month', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-10-14"), moment("2021-11-14"), sources.values()
    );
    expect(result).toEqual(10);
  });

  test('start after End before date next Month', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-10-16"), moment("2021-11-14"), sources.values()
    );
    expect(result).toEqual(0);
  });

  test('start after End after date next Month', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-10-16"), moment("2021-11-16"), sources.values()
    );
    expect(result).toEqual(10);
  });

  test('start before End after date next Month', async () => {
    sources.clear();
    let opts = { ...options };
    sources.add(new IncomeSource(opts));
    var result = await CalculationsManager.instance.calculateTotalIncome(
      moment("2021-10-14"), moment("2021-11-16"), sources.values()
    );
    expect(result).toEqual(20);
  });

});