import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface AccountOptions extends IdentifiableOptions {
  amount: number;
  name: string;
}

export interface SerializedAccount extends SerializedIdentifiable {
  name: string;
  amount: number;
}

export class Account extends Identifiable implements IValued {

  readonly amount: number;
  readonly name: string;

  constructor(options: AccountOptions) {
    super(options);
    this.name = options.name;
    this.amount = options.amount;
  }

  static deserialize(account: SerializedAccount): Account {
    return new Account(account);
  }
}