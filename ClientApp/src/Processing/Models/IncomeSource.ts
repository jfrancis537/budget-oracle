import { IncomeFrequency } from "../Enums/IncomeFrequency";
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface IncomeSourceOptions extends IdentifiableOptions {
  name: string;
  amount: number;
  frequencyType: IncomeFrequency;
  paysOnWeekends: boolean;
  dayOfMonth: number;
}

export interface SerializedIncomeSource extends SerializedIdentifiable {
  name: string;
  amount: number;
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

  constructor(options: IncomeSourceOptions)
  {
    super(options);
    this.amount = options.amount;
    this.frequencyType = options.frequencyType;
    this.name = options.name;
    this.paysOnWeekends = options.paysOnWeekends;
    this.dayOfMonth = options.dayOfMonth;
  }

  static deserialize(source: SerializedIncomeSource): IncomeSource {
    return new IncomeSource(source);
  }
}