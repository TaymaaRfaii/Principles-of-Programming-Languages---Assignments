import { Result, makeFailure, makeOk, bind, either } from "../lib/result";

/* Library code */
const findOrThrow = <T>(pred: (x: T) => boolean, a: T[]): T => {
    for (let i = 0; i < a.length; i++) {
        if (pred(a[i])) return a[i];
    }
    throw "No element found.";
}

export const findResult =<T>(pre:(i:T) => boolean,arr:T[]):Result<T>=>
    arr.length ===0 ?makeFailure("No element found!"):
        pre(arr[0]) ?makeOk(arr[0]):
            findResult(pre,arr.slice(1))

/* Client code */
const returnSquaredIfFoundEven_v1 = (a: number[]): number => {
    try {
        const x = findOrThrow(x => x % 2 === 0, a);
        return x * x;
    } catch (e) {
        return -1;
    }
}

export const returnSquaredIfFoundEven_v2 = (arr:number[]):Result<number> =>
    bind(findResult(pre=> pre%2===0,arr),pre=>makeOk(pre*pre))


export const returnSquaredIfFoundEven_v3 = (arr:number[]):number =>
    either(findResult(pre=>  pre%2===0,arr),pre=>pre*pre,_=>-1)