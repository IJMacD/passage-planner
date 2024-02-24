import { useEffect, useState } from "react";

/**
 * @param {RequestInfo | URL} url
 * @returns {[any, any, boolean]}
 */
export function useFetch (url, type="json") {
    const [ data, setData ] = useState(/** @type {any} */(null));
    const [ error, setError ] = useState(/** @type {any} */(null));
    const [ isLoading, setIsLoading ] = useState(false);

    useEffect(() => {
        let current = true;

        setIsLoading(true);
        fetch(url).then(r => {
            if (current) {
                if (r.ok) {
                    return type === "json" ? r.json() : r.text()
                }
                throw r.text()
            }
        })
        .then(setData, setError)
        .then(() => current && setIsLoading(false));

        return () => { current = false; }
    }, [url, type]);

    return [ data, error, isLoading ];
}