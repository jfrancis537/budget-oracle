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
  export function num(a: number,b:number)
  {
    return a - b;
  }
}