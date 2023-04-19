import { useEffect, useState } from "react";

export function useAnimation(animation) {
    const [, setCounter] = useState(0);
    useEffect(() => {
        if (animation) {
            const id = setInterval(() => setCounter(c => c + 1), 100);
            return () => clearInterval(id);
        }
    }, [animation]);
}
