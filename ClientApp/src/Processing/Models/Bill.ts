import moment, { Moment } from "moment";
import { FrequencyType } from "../Enums/FrequencyType";
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface BillOptions extends IdentifiableOptions{
  amount: number;
  frequency: number;
  frequencyType: FrequencyType;
  initialDate: Moment;
  name: string;
  unavoidable: boolean;
}

export interface SerializedBill extends SerializedIdentifiable{
  amount: number;
  frequency: number;
  frequencyType: number;
  initialDate: string;
  name: string;
  unavoidable: boolean;
}

export class Bill extends Identifiable implements IValued {

  readonly amount: number;
  readonly frequency: number;
  readonly frequencyType: FrequencyType;
  readonly initialDate: Moment;
  readonly name: string;
  readonly unavoidable: boolean;

  constructor(options: BillOptions) {
    super(options);
    this.amount = options.amount;
    this.frequency = options.frequency;
    this.frequencyType = options.frequencyType;
    this.initialDate = options.initialDate;
    this.name = options.name;
    this.unavoidable = options.unavoidable;
  }

  static deserialize(data: SerializedBill): Bill {
    return new Bill({
      name: data.name,
      frequency: data.frequency,
      id: data.id,
      initialDate: moment(data.initialDate),
      amount: data.amount,
      frequencyType: data.frequencyType,
      unavoidable: !!data.unavoidable
    });
  }

}