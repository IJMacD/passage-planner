import { useEffect, useRef } from "react";

/**
 * @see https://stackoverflow.com/a/59843241/1228394
 * @param {*} value
 * @param {*} initialValue
 * @returns
 */
export function usePrevious (value, initialValue) {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};