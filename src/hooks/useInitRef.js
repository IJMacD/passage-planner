import { useRef } from "react";

const uninitialised = Symbol();

/**
 * @template T
 * @param {() => T} initFn
 * @returns {import("react").MutableRefObject<T>}
 */
export function useInitRef (initFn) {
    const ref = useRef(/** @type {T|Symbol} */(uninitialised));

    if (ref.current === uninitialised) {
        ref.current = initFn();
    }

    // @ts-ignore
    return ref;
}