import moment, { Moment } from "moment";
import { CSVParser } from "../../Utilities/CSVParser";
import { Identifiable, IdentifiableOptions, SerializedIdentifiable } from "./Identifiable";

interface VestScheduleOptions extends IdentifiableOptions {
  vests: ScheduledStockVest[];
  name: string;
}

export interface SerializedVestSchedule extends SerializedIdentifiable {
  name: string;
  vests: SerializedScheduledStockVest[];
}

export class VestSchedule extends Identifiable {

  readonly vests: ScheduledStockVest[];
  readonly name: string;

  constructor(options: VestScheduleOptions) {
    super(options);
    this.vests = options.vests;
    this.name = options.name;
  }
  //TODO FIGURE OUT HOW TO DO INVESTMENTS THAT WILL ALSO HAVE AN AMOUNT TAKEN OUT
  static fromCSV(name: string, csvFile: string) {
    const headers = ["name", "symbol", "shares", "cost basis", "tax rate", "date"] as const;
    const reader = new CSVParser(headers);
    let file = reader.parse(csvFile);
    let vests: ScheduledStockVest[] = [];
    for (let i = 0; i < file.length; i++) {
      const payment = new ScheduledStockVest({
        name: file.data.name[i] ?? 'undefined',
        symbol: file.data.symbol[i] ?? 'undefined',
        shares: Number(file.data.shares[i]),
        costBasisPerShare: Number(file.data["cost basis"][i]),
        taxPercentage: Number(file.data["tax rate"][i]),
        date: moment(file.data.date[i])
      });
      vests.push(payment);
    }
    return new VestSchedule({
      vests: vests,
      name: name
    });
  }

  static deserialize(data: SerializedVestSchedule) {
    let vests = data.vests.map(ScheduledStockVest.deserialize);
    return new VestSchedule({
      vests: vests,
      name: data.name,
      id: data.id
    });
  }
}

export interface ScheduledStockVestOptions extends IdentifiableOptions {
  name: string;
  symbol: string;
  shares: number;
  costBasisPerShare: number;
  taxPercentage: number;
  date: Moment;
}

export interface SerializedScheduledStockVest extends SerializedIdentifiable {
  name: string;
  symbol: string;
  shares: number;
  costBasisPerShare: number;
  taxPercentage: number;
  date: string;
}

export class ScheduledStockVest extends Identifiable {

  readonly name: string;
  readonly symbol: string;
  readonly shares: number;
  readonly costBasisPerShare: number;
  readonly taxPercentage: number;
  readonly date: Moment;

  constructor(options: ScheduledStockVestOptions) {
    super(options);

    this.name = options.name;
    this.symbol = options.symbol;
    this.shares = options.shares;
    this.costBasisPerShare = options.costBasisPerShare;
    this.taxPercentage = options.taxPercentage;
    this.date = options.date;
  }

  static deserialize(data: SerializedScheduledStockVest) {
    return new ScheduledStockVest({
      name: data.name,
      symbol: data.symbol,
      date: moment(data.date),
      id: data.id,
      shares: data.shares,
      costBasisPerShare: data.costBasisPerShare,
      taxPercentage: data.taxPercentage
    });
  }
}