import { useEffect, useState } from "react";

/**
 *
 * @param {boolean} active
 * @param {number} interval
 */
export function useAnimation(active, interval = 100) {
    const [, setCounter] = useState(0);
    useEffect(() => {
        if (active) {
            const id = setInterval(() => setCounter(c => c + 1), interval);
            return () => clearInterval(id);
        }
    }, [active, interval]);
}
