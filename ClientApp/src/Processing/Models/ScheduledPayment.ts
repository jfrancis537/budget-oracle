import moment, { Moment } from "moment";
import { CSVParser } from "../../Utilities/CSVParser";
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface PaymentScheduleOptions extends IdentifiableOptions {
  payments: ScheduledPayment[];
  name: string;
}

export interface SerializedPaymentSchedule extends SerializedIdentifiable {
  name: string;
  payments: SerializedScheduledPayment[];
}

export class PaymentSchedule extends Identifiable {

  readonly payments: ScheduledPayment[];
  readonly name: string;

  constructor(options: PaymentScheduleOptions) {
    super(options);
    this.payments = options.payments;
    this.name = options.name;
  }
  //TODO FIGURE OUT HOW TO DO INVESTMENTS THAT WILL ALSO HAVE AN AMOUNT TAKEN OUT
  static fromCSV(name: string, csvFile: string) {
    const headers = ['name', "date", 'amount'] as const;
    const reader = new CSVParser(headers);
    let file = reader.parse(csvFile);
    let payments: ScheduledPayment[] = [];
    for (let i = 0; i < file.length; i++) {
      const payment = new ScheduledPayment({
        name: file.data.name[i] ?? 'undefined',
        date: moment(file.data.date[i]),
        amount: Number(file.data.amount[i])
      });
      payments.push(payment);
    }
    return new PaymentSchedule({
      payments: payments,
      name: name
    });
  }

  static deserialize(data: SerializedPaymentSchedule) {
    let payments = data.payments.map(ScheduledPayment.deserialize);
    return new PaymentSchedule({
      payments: payments,
      name: data.name,
      id: data.id
    });
  }
}

export interface ScheduledPaymentOptions extends IdentifiableOptions {
  name: string;
  amount: number;
  date: Moment
}

export interface SerializedScheduledPayment extends SerializedIdentifiable {
  name: string;
  amount: number;
  date: string;
}

export class ScheduledPayment extends Identifiable implements IValued {

  readonly amount: number;
  readonly name: string;
  readonly date: Moment;

  constructor(options: ScheduledPaymentOptions) {
    super(options);
    this.amount = options.amount;
    this.name = options.name;
    this.date = options.date;
  }

  static deserialize(data: SerializedScheduledPayment) {
    return new ScheduledPayment({
      name: data.name,
      date: moment(data.date),
      id: data.id,
      amount: data.amount
    });
  }
}