import { useEffect, useState } from "react";
import { fetchAIS } from "../util/ais";
import { getTileBounds } from "../util/geo";

/**
 * @param {[number, number]} centre
 * @param {number} zoom
 */
export function useAHAIS (centre, zoom) {
    const [ vessels, setVessels ] = useState(/** @type {import("../util/ais").Vessel[]} */([]));

    useEffect(() => {
        async function run () {
            const bounds = getTileBounds(centre, zoom);
            try {
                const [status,vessels]  = await fetchAIS(bounds);

                if (status.ERROR) {
                    console.error(status);
                }
                else {
                    setVessels(vessels);
                }
            }
            catch (e) {}
        }

        run();

        const id = setInterval(run, 60 * 1000);

        return () => clearInterval(id);
    }, [centre, zoom]);

    return vessels;
}