import { useEffect, useRef, useState } from "react";
import { WSAIS } from "../util/ais.js";

const VESSEL_CACHE_KEY = "passagePlanner.vessels";

/**
 * @typedef {import("../util/ais.js").VesselReport} VesselReport
 */

/**
 * @param {boolean} active
 */
export function useWSAIS (active) {
    /** @type {import("react").MutableRefObject<WSAIS?>} */
    const aisRef = useRef(null);

    const vesselMapRef = useRef(/** @type {Map<number, VesselReport>} */(new Map()));


    const [ vessels, setVessels ] = useState(/** @type {VesselReport[]} */([]));

    if (!aisRef.current) {
        aisRef.current = new WSAIS();
    }

    useEffect(() => {
        if (active) {
            /**
             *
             * @param {import("../util/ais").Vessel & { type: number, repeatIndicator?: number }} message
             */
            function cb (message) {
                // console.debug(message);

                const { type, repeatIndicator, ...vessel } = message;

                const lastUpdate = Date.now();

                if (type === 1 || type === 2 || type === 3 || type === 5) {
                    const oldVessel = vesselMapRef.current.get(vessel.mmsi);
                    if (oldVessel) {
                        const updatedVessel = { ...oldVessel, ...vessel, lastUpdate };
                        vesselMapRef.current.set(vessel.mmsi, updatedVessel);
                        setVessels([...vesselMapRef.current.values()]);

                        if (type === 5) {
                            saveVessel(vessel.mmsi, vessel);
                        }
                    }
                    // We have position info for a new vessel
                    else if (type !== 5) {
                        // Try to retrieve saved info
                        const savedVessel = getSavedVessel(vessel.mmsi) || {};

                        vesselMapRef.current.set(vessel.mmsi, { ...savedVessel, ...vessel, lastUpdate });

                        setVessels([...vesselMapRef.current.values()]);
                    }
                }
                else {
                    console.debug(message);
                }
            }

            aisRef.current?.addListener(cb);

            return () => aisRef.current?.removeListener(cb);
        }
    }, [active]);

    return vessels;
}

/**
 * @param {number} mmsi
 * @returns {import("../util/ais.js").Vessel|undefined}
 */
function getSavedVessel (mmsi) {
    const savedNames = localStorage.getItem(VESSEL_CACHE_KEY);
    if (savedNames) {
        try {
            const names = JSON.parse(savedNames);
            return names[mmsi];
        }
        catch (e) {}
    }
}

/**
 *
 * @param {number} mmsi
 * @param {import("../util/ais.js").Vessel} vessel
 */
function saveVessel (mmsi, vessel) {
    let vessels = {};
    const savedVessels = localStorage.getItem(VESSEL_CACHE_KEY);
    if (savedVessels) {
        try {
            vessels = JSON.parse(savedVessels);
        }
        catch (e) {}
    }
    const savedVessel = vessels[mmsi] || {};
    vessels[mmsi] = { ...savedVessel, ...vessel };
    localStorage.setItem(VESSEL_CACHE_KEY, JSON.stringify(vessels));
}