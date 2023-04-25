import { useEffect, useState } from "react";
import { fetchAIS, getAISURL } from "../util/ais/ais.js";
import { getBounds } from "../util/projection.js";

/**
 * @param {import("../Components/StaticMap.js").StaticMapContextValue} context
 */
export function useAisHubVessels (context) {
    const [ vessels, setVessels ] = useState(/** @type {import("../util/ais/ais.js").VesselReport[]} */([]));

    const url = getAISURL(getBounds(context));

    useEffect(() => {

        async function run () {
            if (url) {
                try {
                    const [status,vessels]  = await fetchAIS(url);

                    if (status.ERROR) {
                        console.error(status);
                    }
                    else {
                        setVessels(vessels);
                    }
                }
                catch (e) {}
            }
        }

        if (url) {
            run();

            const id = setInterval(run, 61 * 1000);

            return () => clearInterval(id);
        }
    }, [url]);

    return vessels;
}