/**
 * @typedef Vessel
 * @property {number} mmsi
 * @property {string} [name]
 * @property {number} navigationStatus
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} [speedOverGround] Knots
 * @property {number} [courseOverGround] Degrees
 * @property {number} rateOfTurn Degrees per minute
 * @property {number} [trueHeading] Degrees
 * @property {number} timestamp clock seconds of report
 * @property {number} manoeuvreIndicator
 * @property {number} [aisVersion]
 * @property {number} [imoNumber]
 * @property {string} [callSign]
 * @property {number} [shipType]
 * @property {number} [dimensionToBow] in Metres
 * @property {number} [dimensionToStern] in Metres
 * @property {number} [dimensionToPort] in Metres
 * @property {number} [dimensionToStarboard] in Metres
 * @property {number} [fixType]
 * @property {number} [etaMonth]
 * @property {number} [etaDay]
 * @property {number} [etaHour]
 * @property {number} [etaMinute]
 * @property {number} [draught]
 * @property {string} [destination]
 */

// const AIS_API_ROOT = "https://data.aishub.net";
// const AIS_API_ROOT = "http://localhost:8010/proxy";
const AIS_API_ROOT = "https://passage.ijmacd.com/ais";
const USERNAME = "AH_2974_8FB18DDD";

/**
 * @typedef {(import("./ais").Vessel & {lastUpdate: number;})} VesselReport
 */

/**
 * @param {string} url
 * @returns {Promise<[status: any, vessels: VesselReport[]]>}
 */
export async function fetchAIS (url) {
    const r = await fetch(url);
    const d = await r.json();
    if (d[0].ERROR) return d;
    return [ d[0], d[1].map(v => ({ mmsi: v.MMSI, name: v.NAME, navigationStatus: v.NAVSTAT, longitude: v.LONGITUDE, latitude: v.LATITUDE, speedOverGround: v.SOG === 102.3 ? undefined : v.SOG, courseOverGround: v.COG, trueHeading: v.HEADING === 511 ? undefined : v.HEADING, lastUpdate: +new Date(v.TIME), shipType: v.TYPE })) ];
}

/**
 * @param {[minLon: number, minLat: number, maxLon: number, maxLat: number]} bounds
 */
export function getAISURL (bounds) {
    let [minLon, minLat, maxLon, maxLat] = bounds;
    minLon = Math.floor(minLon * 10) / 10;
    minLat = Math.floor(minLat * 10) / 10;
    maxLon = Math.ceil(maxLon * 10) / 10;
    maxLat = Math.ceil(maxLat * 10) / 10;
    return `${AIS_API_ROOT}/ws.php?username=${USERNAME}&format=1&output=json&latmin=${minLat}&latmax=${maxLat}&lonmin=${minLon}&lonmax=${maxLon}`;
}

/**
 *
 * @param {VesselReport[][]} sets
 */
export function combineAIS (sets) {
    /** @type {Map<number, VesselReport>} */
    const map = new Map();

    for (const set of sets) {
        for (const v of set) {
            // Update vessel if it is in the map and we have a newer update
            if (map.has(v.mmsi)) {
                const vessel = map.get(v.mmsi);

                if (!vessel || v.lastUpdate > vessel.lastUpdate) {
                    map.set(v.mmsi, { ...vessel, ...v });
                }
            }
            else {
                map.set(v.mmsi, v);
            }
        }
    }

    return [...map.values()];
}

export const NavigationStatus = {
    UNDERWAY_USING_ENGINE: 0,
    AT_ANCHOR: 1,
    NOT_UNDER_COMMAND: 2,
    RESTRICTED_MANOEUVRABILITY: 3,
    CONSTRAINED_BY_DRAUGHT: 4,
    MOORED: 5,
    AGROUND: 6,
    ENGAGED_IN_FISHING: 7,
    UNDERWAY_SAILING: 8,
    RESERVED_HSC: 9,
    SART: 14,
    NOT_DEFINED: 15,
};