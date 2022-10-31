import moment, { Moment } from "moment";

export function ArrayEquals<T>(a: ArrayLike<T>, b: ArrayLike<T>) {
  let result = false;
  if (a.length === b.length) {
    result = true;
    for (let i = 0; i < a.length; i++) {
      let aVal = a[i];
      let bVal = b[i];
      if (aVal !== bVal) {
        result = false;
        break;
      }
    }
  }
  return result;
}

export namespace Sorting {
  export function num(a: number, b: number, ascending = true) {
    if (ascending) {
      return a - b;
    } else {
      return b - a;
    }
  }

  export function dateString(a: string, b: string, ascending = true) {
    const aDate = moment(a);
    const bDate = moment(b);
    return date(aDate, bDate, ascending);
  }

  export function date(a: Moment, b: Moment, ascending = true) {
    if(ascending)
    {
      return a.diff(b);
    } else {
      return b.diff(a);
    }
  }
}