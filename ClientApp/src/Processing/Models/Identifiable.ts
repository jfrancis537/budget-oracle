import * as uuid from 'uuid';

export interface IdentifiableOptions {
  id?: string;
}

export interface SerializedIdentifiable {
  id: string;
}

export class Identifiable {

  readonly id: string;

  constructor(options: IdentifiableOptions)
  {
    this.id = options.id ?? uuid.v4();
  }
}