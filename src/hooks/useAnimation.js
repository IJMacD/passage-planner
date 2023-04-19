import { useEffect, useState } from "react";

export function useAnimation(animation) {
    const [counter, setCounter] = useState(0);
    useEffect(() => {
        if (animation) {
            const id = setInterval(() => setCounter(c => c + 1), 1000);
            return () => clearInterval(id);
        }
    }, [animation]);
}
