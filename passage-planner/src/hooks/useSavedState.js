import { useCallback, useEffect, useState } from "react";

/**
 * @template T
 * @param {string} key
 * @param {T | () => T} initialValue
 * @returns {[ T, (newValue: T|((oldState: T) => T)) => void ]}
 */
export function useSavedState (key, initialValue) {
    const [ state, setState ] = useState(() => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }

        return initialValue instanceof Function ? initialValue() : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        const callback = e => setState(e.newValue || initialValue);

        window.addEventListener("storage", callback);

        return () => window.removeEventListener("storage", callback);
    }, [initialValue]);

    return [state, setState];
}