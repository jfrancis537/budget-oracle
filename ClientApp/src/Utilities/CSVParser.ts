import { TypedObject } from "./ObjectUtils";

export class CSVParseError<T> extends Error {

  public readonly headers: ReadonlyArray<keyof T>;

  constructor(msg: string, headers: ReadonlyArray<keyof T>) {
    super(msg);
    this.headers = headers;
  }
}

type CSVLine<T, S> = {
  [key in keyof T]: S;
}

export class CSVFile<T, S> {

  public readonly data: { [key in keyof T]: (S)[] }
  public readonly length: number;

  constructor(data: { [key in keyof T]: (S)[] }, length: number) {
    this.data = Object.freeze(data);
    this.length = length;
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.length; i++) {
      const keys = TypedObject.keys(this.data);
      const entries: [keyof T, S][] = keys.map(key => [key, this.data[key][i]]);
      const line: CSVLine<T, S> = TypedObject.fromEntries(entries);
      yield line;
    }
  }
}

export class CSVParser<T> {

  private readonly headers: ReadonlyArray<keyof T>;

  constructor(headers: ReadonlyArray<keyof T>) {
    this.headers = headers;
  }

  private validateHeaders(headers: string[]) {
    if (headers.length !== this.headers.length) {
      throw new CSVParseError("Failed to parse, headers don't match", headers);
    }

    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== this.headers[i]) {
        throw new CSVParseError("Failed to parse, headers don't match", headers);
      }
    }
  }

  /**
   * Parses the CSV file, if data is missing the value will be undefined
   * @param file csv file text
   * @returns 
   */
  public parse(file: string): CSVFile<T, string | undefined> {
    try {
      const entries: [keyof T, (string | undefined)[]][] = this.headers.map(header => [header, []]);
      const csv = {
        length: 0,
        data: TypedObject.fromEntries(entries)
      }
      const lines = file.split("\n")
        .map(line => line.replace("\r", ""))
        .filter(line => line.trim() !== '');
      //Eliminate Header
      this.validateHeaders(lines.shift()!.split(','))
      csv.length = lines.length;
      for (const line of lines) {
        const items = line.split(",");
        for (let i = 0; i < this.headers.length; i++) {
          // If there is nothing, place empty string
          if (i >= items.length) {
            csv.data[this.headers[i]].push(undefined);
          } else {
            csv.data[this.headers[i]].push(items[i]);
          }
        }
      }
      return new CSVFile(csv.data, csv.length);
    } catch (e) {
      const err = new Error()
      if (e instanceof Error) {
        err.stack = e.stack;
      }
      throw err;
    }
  }

  public parseStrict(file: string): CSVFile<T, string> {
    try {
      const entries: [keyof T, (string)[]][] = this.headers.map(header => [header, []]);
      const csv = {
        length: 0,
        data: TypedObject.fromEntries(entries)
      }
      const lines = file.split("\n")
        .map(line => line.replace("\r", ""))
        .filter(line => line.trim() !== '');
      //Eliminate Header
      this.validateHeaders(lines.shift()!.split(','))
      csv.length = lines.length;
      for (const line of lines) {
        const items = line.split(",");
        for (let i = 0; i < this.headers.length; i++) {
          // If there is nothing, place empty string
          if (i >= items.length) {
            throw new CSVParseError("Failed to parse CSV, detected incomplete line", this.headers);
          } else {
            csv.data[this.headers[i]].push(items[i]);
          }
        }
      }
      return new CSVFile(csv.data, csv.length);
    } catch (e) {
      const err = new Error()
      if (e instanceof Error) {
        err.stack = e.stack;
      }
      throw err;
    }
  }
}