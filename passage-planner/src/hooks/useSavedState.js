import { useCallback, useEffect, useState } from "react";

/**
 * @template T
 * @param {string} key
 * @param {T} initialValue
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

        return initialValue;
    });

    const setSavedState = useCallback(newValue => {
        if (newValue instanceof Function) {
            setState(oldValue => {
                const nv = newValue(oldValue);

                localStorage.setItem(key, JSON.stringify(nv));

                return nv;
            });
        } else {
            setState(newValue);

            localStorage.setItem(key, JSON.stringify(newValue));
        }
    }, [key, setState]);

    useEffect(() => {
        const callback = e => setState(e.newValue || initialValue);

        window.addEventListener("storage", callback);

        return () => window.removeEventListener("storage", callback);
    }, [initialValue]);

    return [ state, setSavedState ];
}