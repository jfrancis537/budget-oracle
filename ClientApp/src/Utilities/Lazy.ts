type InitalizerFunction<T> = () => T

export class Lazy<T> {

  private initalizer: InitalizerFunction<T> | undefined;
  private _instance: T | undefined;

  constructor(initalizer: InitalizerFunction<T>)
  {
    this.initalizer = initalizer;
  }

  get instance(): T {
    if(!this._instance)
    {
      this._instance = this.initalizer!();
      this.initalizer = undefined;
    }
    return this._instance!;
  }


}