import moment from "moment";
import { FrequencyType } from "../Processing/Enums/FrequencyType";
import { CalculationsManager } from "../Processing/Managers/CalculationsManager";
import { Bill, BillOptions } from "../Processing/Models/Bill";
import { CalculationTools } from "../Utilities/CalculationTools";

describe('Bill calc weekly - simple', () => {
  //Setup
  let bill = new Bill({
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Weekly,
    initialDate: moment('2021-09-01'),
    name: 'SampleBill',
    unavoidable: false
  });
  let bills = new Set([
    bill
  ]);
  test('Start Dow < Bill < End Dow', async () => {
    //Test Start date is before bill date and end is after bill date
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-30'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(80);
  });

  test('Start DOW > Bill DOW && Start DOW < End DOW && Bill DOW < End DOW', async () => {
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(70);
  });

  test('Start DOW > Bill DOW && Start DOW > End DOW && Bill DOW < End DOW', async () => {
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-04'), moment('2021-10-22'), bills.values())
    expect(result[1]).toEqual(70);
  });
  test('Start DOW > Bill DOW && Start DOW > End DOW && Bill DOW > End DOW', async () => {
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-04'), moment('2021-10-19'), bills.values())
    expect(result[1]).toEqual(60);
  });
});

describe('Bill calc daily', () => {
  //Setup
  let options: BillOptions = {
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Daily,
    initialDate: moment('2021-09-01'),
    name: 'SampleBill',
    unavoidable: false,
    endDate: undefined
  }
  let bills = new Set<Bill>();
  test('Start after bill date', async () => {
    bills.clear();
    bills.add(new Bill(options));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-03'), moment('2021-09-10'), bills.values())
    expect(result[1]).toEqual(80);
  });

  test('Tri-Daily', async () => {
    bills.clear();
    let opts = { ...options };
    opts.frequency = 3;
    opts.initialDate = opts.initialDate.clone();
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-09-10'), bills.values())
    expect(result[1]).toEqual(30);
  });

  test('Tri-Daily Less than two occurances', async () => {
    bills.clear();
    let opts = { ...options };
    opts.frequency = 3;
    opts.initialDate = opts.initialDate.clone();
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-09-05'), bills.values())
    expect(result[1]).toEqual(10);
  });

  test('5-Daily', async () => {
    bills.clear();
    let opts = { ...options };
    opts.frequency = 5;
    opts.initialDate = opts.initialDate.clone();
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-09-10'), bills.values())
    expect(result[1]).toEqual(10);
  });

  test('bi-Daily', async () => {
    bills.clear();
    let opts = { ...options };
    opts.frequency = 2;
    opts.initialDate = opts.initialDate.clone();
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-30'), moment('2021-09-10'), bills.values())
    expect(result[1]).toEqual(50);
  });

  test('daily with end date', async () => {
    bills.clear();
    let opts = { ...options };
    opts.initialDate = opts.initialDate.clone();
    opts.endDate = opts.initialDate.clone().add(10,"days");
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-09-27'), bills.values())
    expect(result[1]).toEqual(100);
  });
});

describe('Bill calc weekly - intervals', () => {
  //Setup
  let billOptions = {
    amount: 10,
    frequency: 2,
    frequencyType: FrequencyType.Weekly,
    initialDate: moment('2021-09-01'),
    name: 'SampleBill',
    unavoidable: false
  };
  let bills = new Set<Bill>();
  test('Bi-weekly', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 2
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-30'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(40);
  });

  test('Tri-Weekly', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 3
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-30'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(30);
  });

  test('5-Weekly', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 5
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-30'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(20);
  });

  test('5-Weekly - After First Bill', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 5
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-11-12'), bills.values())
    expect(result[1]).toEqual(20);
  });

  test('5-Weekly - After First Bill | One Time', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 5
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-10-23'), bills.values())
    expect(result[1]).toEqual(10);
  });

  test('5-Weekly - On First Bill', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 5
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-01'), moment('2021-10-21'), bills.values())
    expect(result[1]).toEqual(20);
  });

  test('5-Weekly - No Charge', async () => {
    bills.clear();
    let opts = { ...billOptions };
    opts.frequency = 5
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-02'), moment('2021-09-30'), bills.values())
    expect(result[1]).toEqual(0);
  });
});

describe('Bill calc monthly - Simple', () => {
  let billOptions = {
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Monthly,
    initialDate: moment('2021-09-02'),
    name: 'SampleBill',
    unavoidable: false
  };
  let bills = new Set<Bill>();
  test('Start Before, End Before', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-02'), moment('2022-02-01'), bills.values())
    expect(result[1]).toEqual(50);
  });
  test('Start Before, End After', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-02'), moment('2021-12-03'), bills.values())
    expect(result[1]).toEqual(40);
  });
  test('Start After, End Before', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-09-05'), moment('2021-12-01'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Start After, End After', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await await CalculationTools.calculateAllBillsCost(moment('2021-09-05'), moment('2021-12-03'), bills.values())
    expect(result[1]).toEqual(30);
  });
});

describe('Bill calc monthly - Intervals', () => {
  let billOptions = {
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Monthly,
    initialDate: moment('2021-09-02'),
    name: 'SampleBill',
    unavoidable: false
  };
  let bills = new Set<Bill>();
  test('Bi-Monthly, End Before', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-02'), moment('2021-12-01'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Bi-Monthly, End After', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-08-02'), moment('2021-12-03'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Tri-Monthly, End Before', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 3;
    opts.initialDate = moment('2021-02-02');
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-01-02'), moment('2021-08-01'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Tri-Monthly, End After', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 3;
    opts.initialDate = moment('2021-02-02');
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2021-01-02'), moment('2021-10-04'), bills.values())
    expect(result[1]).toEqual(30);
  });
});

describe('Bill calc Anually - Simple', () => {
  let billOptions = {
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Anually,
    initialDate: moment('2020-03-02'),
    name: 'SampleBill',
    unavoidable: false
  };
  let bills = new Set<Bill>();
  test('Start Before, End Before', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2020-02-02'), moment('2022-03-01'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Start Before, End After', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2020-02-02'), moment('2022-03-03'), bills.values())
    expect(result[1]).toEqual(30);
  });
  test('Start After, End Before', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2020-04-02'), moment('2022-02-01'), bills.values())
    expect(result[1]).toEqual(10);
  });
  test('Start After, End After', async () => {
    bills.clear();
    bills.add(new Bill(billOptions));
    let result = await CalculationTools.calculateAllBillsCost(moment('2020-04-02'), moment('2022-03-03'), bills.values())
    expect(result[1]).toEqual(20);
  });
});

describe('Bill calc Anually - Intervals', () => {
  let billOptions = {
    amount: 10,
    frequency: 1,
    frequencyType: FrequencyType.Anually,
    initialDate: moment('2018-05-20'),
    name: 'SampleBill',
    unavoidable: false
  };
  let bills = new Set<Bill>();
  test('Bi-Anually, Start After, End Before', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2019-08-02'), moment('2022-04-20'), bills.values())
    expect(result[1]).toEqual(10);
  });
  test('Bi-Anually, Start After, End After', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2019-08-02'), moment('2022-09-03'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Bi-Anually,Start Before, End After', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2017-08-02'), moment('2022-09-03'), bills.values())
    expect(result[1]).toEqual(30);
  });
  test('Bi-Anually,Start before, End Before', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 2;
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2017-08-02'), moment('2022-04-03'), bills.values())
    expect(result[1]).toEqual(20);
  });
  test('Tri-Anually, End Before', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 3;
    opts.initialDate = moment('2010-05-20');
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2009-01-02'), moment('2020-04-01'), bills.values())
    expect(result[1]).toEqual(40);
  });
  test('Tri-Anually, End After', async () => {
    bills.clear();
    let opts = { ...billOptions }
    opts.frequency = 3;
    opts.initialDate = moment('2010-02-02');
    bills.add(new Bill(opts));
    let result = await CalculationTools.calculateAllBillsCost(moment('2009-01-02'), moment('2020-10-04'), bills.values())
    expect(result[1]).toEqual(40);
  });
});