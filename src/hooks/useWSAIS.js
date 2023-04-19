import { useEffect, useRef, useState } from "react";
import { WSAIS } from "../util/ais.js";

const NAME_CACHE_KEY = "passagePlanner.names";

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

                        if (vessel.name) {
                            saveVesselName(vessel.mmsi, vessel.name);
                        }
                    }
                    else if (type !== 5) {
                        // New vessel

                        const name = getSavedName(vessel.mmsi);
                        if (name) {
                            vessel.name = name;
                        }

                        vesselMapRef.current.set(vessel.mmsi, { ...vessel, lastUpdate });
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
 * @returns {string|undefined}
 */
function getSavedName (mmsi) {
    const savedNames = localStorage.getItem(NAME_CACHE_KEY);
    if (savedNames) {
        try {
            const names = JSON.parse(savedNames);
            return names[mmsi];
        }
        catch (e) {}
    }
}

function saveVesselName (mmsi, name) {
    let names = {};
    const savedNames = localStorage.getItem(NAME_CACHE_KEY);
    if (savedNames) {
        try {
            names = JSON.parse(savedNames);
        }
        catch (e) {}
    }
    names[mmsi] = name;
    localStorage.setItem(NAME_CACHE_KEY, JSON.stringify(names));
}