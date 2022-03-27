export class CSVParser<T> {

  readonly headers?: Array<keyof T>;

  constructor(headers?: Array<keyof T>) {
    this.headers = headers;
  }

  public parse(file: string) {
    try {
      let lines = file.split("\n");
      const results: string[][] = [];
      //we don't need the header line
      lines.shift();
      lines = lines.filter(line => line !== "");
      for (let line of lines) {
        const items = line.split(",");
        results.push(items);
      }
      return results;
    } catch {
      throw new Error("Failed to parse!");
    }
  }
}