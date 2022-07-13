import moment, { Moment } from "moment";
import { IncomeFrequency } from "../Enums/IncomeFrequency";
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface IncomeSourceOptions extends IdentifiableOptions {
  name: string;
  amount: number;
  startDate: Moment;
  frequencyType: IncomeFrequency;
  paysOnWeekends: boolean;
  dayOfMonth: number;
}

export interface SerializedIncomeSource extends SerializedIdentifiable {
  name: string;
  amount: number;
  startDate: string;
  frequencyType: number;
  paysOnWeekends: boolean;
  dayOfMonth: number;
}

export class IncomeSource extends Identifiable implements IValued {

  readonly name: string;
  readonly amount: number;
  readonly frequencyType: IncomeFrequency;
  readonly paysOnWeekends: boolean;
  readonly dayOfMonth: number;
  readonly startDate: Moment;

  constructor(options: IncomeSourceOptions) {
    super(options);
    this.amount = options.amount;
    this.frequencyType = options.frequencyType;
    this.name = options.name;
    this.paysOnWeekends = options.paysOnWeekends;
    this.dayOfMonth = options.dayOfMonth;
    this.startDate = options.startDate;
  }

  static deserialize(source: SerializedIncomeSource): IncomeSource {
    return new IncomeSource({
      amount: source.amount,
      frequencyType: source.frequencyType,
      name: source.name,
      paysOnWeekends: source.paysOnWeekends,
      dayOfMonth: source.dayOfMonth,
      startDate: moment(source.startDate),
      id: source.id
    });
  }
}