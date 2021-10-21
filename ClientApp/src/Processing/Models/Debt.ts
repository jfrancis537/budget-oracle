import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";

interface DebtOptions extends IdentifiableOptions {
  name: string;
  amount: number;
}

export interface SerializedDebt extends SerializedIdentifiable {
  name: string;
  amount: number;
}

export class Debt extends Identifiable {
  readonly name: string;
  readonly amount: number;

  constructor(options: DebtOptions) {
    super(options);
    this.amount = options.amount;
    this.name = options.name;
  }

  static deserialize(debt: SerializedDebt): Debt {
    return new Debt(debt);
  }
}