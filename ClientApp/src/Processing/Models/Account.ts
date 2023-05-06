import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";
import { IValued } from "./Valued";

interface AccountOptions extends IdentifiableOptions {
  amount: number;
  name: string;
  liquid: boolean;
}

export interface SerializedAccount extends SerializedIdentifiable {
  name: string;
  amount: number;
  liquid: boolean;
}

export class Account extends Identifiable implements IValued {

  readonly amount: number;
  readonly name: string;
  readonly liquid: boolean;

  constructor(options: AccountOptions) {
    super(options);
    this.liquid = options.liquid;
    this.name = options.name;
    this.amount = options.amount;
  }

  static deserialize(account: SerializedAccount): Account {
    return new Account(account);
  }
}