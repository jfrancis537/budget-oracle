import { unitOfTime } from "moment";


export enum FrequencyType {
  Daily,
  Weekly,
  Monthly,
  Anually
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace FrequencyType {
  export function toMomentType(type: FrequencyType): unitOfTime.Base {
    let result: unitOfTime.Base = 'seconds';
    switch (type) {
      case FrequencyType.Daily:
        result = 'days';
        break;
      case FrequencyType.Weekly:
        result = 'weeks';
        break;
      case FrequencyType.Monthly:
        result = 'months';
        break;
      case FrequencyType.Anually:
        result = 'years';
        break;
    }
    return result;
  }
}