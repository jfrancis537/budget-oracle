export namespace DOMUtils {
  /**
   * This function sets an anchor to not redirect when clicked. This utility function was created to limit the number of es-lint warnings.
   */
  export function removeAnchorNavigation(anchor: HTMLAnchorElement) {
    //This line is disabled because this is a valid way of making anchors do nothing.
    // eslint-disable-next-line
    anchor.setAttribute('href', 'javascript:void(0);');
  }

  /**
   * This function will run your function when the page is ready. If the page is already ready then it will just run it like normal.
   * @returns a promise to the return value of your function.
   */
  export function runWhenPageIsReady<T, A extends Array<unknown>>(func: (...args: A) => T | PromiseLike<T>, args: A): Promise<T> {
    let result: Promise<T>;
    if (document.readyState === 'complete') {
      result = Promise.resolve(func(...args));
    } else {
      result = new Promise(resolve => {
        //Check the document state every 50ms
        let documentStateCheck = setInterval(() => {
          if (document.readyState === 'complete') {
            clearInterval(documentStateCheck);
            resolve(func(...args));
          }
        }, 50);
      });
    }
    return result;
  }
}