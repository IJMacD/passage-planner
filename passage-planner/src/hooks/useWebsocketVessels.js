import { useEffect, useRef, useState } from "react";
import { WebsocketAIS } from "../util/ais/WebsocketAIS.js";
import { useInitRef } from "./useInitRef.js";

const VESSEL_CACHE_KEY = "passagePlanner.vessels";

/**
 * @typedef {import("../util/ais/ais.js").VesselReport} VesselReport
 */

/**
 * @param {boolean} [active]
 */
export function useWebsocketVessels (active = true) {
    const aisRef = useInitRef(() => new WebsocketAIS());

    const vesselMapRef = useRef(/** @type {Map<number, VesselReport>} */(new Map()));

    const [ vessels, setVessels ] = useState(/** @type {VesselReport[]} */([]));

    useEffect(() => {
        if (active) {
            /**
             *
             * @param {import("../util/ais/ais.js").Vessel & { type: number, repeatIndicator?: number }} message
             */
            function cb (message) {
                // console.debug(message);

                const { type, repeatIndicator, ...vessel } = message;

                const lastUpdate = Date.now();

                const havePosition = (typeof message.longitude === "number" && typeof message.latitude === "number");
                const haveName = typeof message.name === "string";

                if (havePosition) {
                    // We received a position report (e.g. 1, 2, 3, 18, 19 etc.)

                    // Are we currently tracking this vessel?
                    const oldVessel = vesselMapRef.current.get(vessel.mmsi);

                    if (oldVessel) {
                        const updatedVessel = { ...oldVessel, ...vessel, lastUpdate };

                        vesselMapRef.current.set(vessel.mmsi, updatedVessel);
                    }
                    else {
                        // We're not currently tracking this vessel
                        // Try to retrieve saved info from local storage
                        const savedVessel = getSavedVessel(vessel.mmsi) || {};

                        vesselMapRef.current.set(vessel.mmsi, { ...savedVessel, ...vessel, lastUpdate });
                    }

                    setVessels([...vesselMapRef.current.values()]);
                }

                if (haveName) {
                    // We received a status report (e.g. 5, 19)

                    // Are we currently tracking this vessel?
                    const oldVessel = vesselMapRef.current.get(vessel.mmsi);

                    if (oldVessel) {
                        // Don't update lastUpdate time
                        const updatedVessel = { ...oldVessel, ...vessel };
                        vesselMapRef.current.set(vessel.mmsi, updatedVessel);
                        setVessels([...vesselMapRef.current.values()]);
                    }

                    // Save static info to local storage
                    saveVessel(vessel.mmsi, vessel);
                }

                if (!havePosition && !haveName) {
                    // Unknown message type
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
 * @returns {import("../util/ais/ais.js").Vessel|undefined}
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
 * @param {import("../util/ais/ais.js").Vessel} vessel
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