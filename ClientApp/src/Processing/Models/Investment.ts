
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";

export enum InvestmentType {
  StockETF,
  Option,
  MutualFund
}

interface InvestmentOptions extends IdentifiableOptions {
  name: string;
  shares: number;
  symbol: string;
  costBasisPerShare: number;
  marginDebt: number;
  marginInterestRate: number;
}

export interface SerializedInvestment extends SerializedIdentifiable {
  name: string;
  shares: number;
  symbol: string;
  costBasisPerShare: number;
  marginDebt: number;
  marginInterestRate: number;
}

export class Investment extends Identifiable {

  readonly name: string;
  readonly shares: number;
  readonly symbol: string;
  readonly costBasisPerShare: number;
  readonly marginDebt: number;
  readonly marginInterestRate: number;

  constructor(options: InvestmentOptions) {
    super(options);
    this.name = options.name;
    this.shares = options.shares;
    this.symbol = options.symbol?.toUpperCase();
    this.costBasisPerShare = options.costBasisPerShare;
    this.marginDebt = options.marginDebt ?? 0;
    this.marginInterestRate = options.marginInterestRate ?? 0;
  }

  static deserialize(source: SerializedInvestment): Investment {
    return new Investment(source);
  }
}