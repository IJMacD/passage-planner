/**
 * @typedef Vessel
 * @property {number} mmsi
 * @property {string} [name]
 * @property {number} navigationStatus
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} speedOverGround
 * @property {number} courseOverGround
 */

// const AIS_API_ROOT = "https://data.aishub.net";
// const AIS_API_ROOT = "http://localhost:8010/proxy";
const AIS_API_ROOT = "https://passage.ijmacd.com/ais";
const USERNAME = "AH_2974_8FB18DDD";

export async function fetchAIS (bounds) {
    let [ minLon, minLat, maxLon, maxLat ] = bounds;
    minLon = Math.floor(minLon * 10) / 10;
    minLat = Math.floor(minLat * 10) / 10;
    maxLon = Math.ceil(maxLon * 10) / 10;
    maxLat = Math.ceil(maxLat * 10) / 10;
    const r = await fetch(`${AIS_API_ROOT}/ws.php?username=${USERNAME}&format=1&output=json&latmin=${minLat}&latmax=${maxLat}&lonmin=${minLon}&lonmax=${maxLon}`);
    const d = await r.json();
    if (d[0].ERROR) return d;
    return [ d[0], d[1].map(v => ({ mmsi: v.MMSI, name: v.NAME, navigationStatus: v.NAVSTAT, longitude: v.LONGITUDE, latitude: v.LATITUDE, speedOverGround: v.SOG, courseOverGround: v.COG, timestamp: new Date(v.TIME) })) ];
}

/**
 *
 * @param {string} input
 * @returns {Vessel}
 */
export function decodeRawMessage (input) {
    if (!input.startsWith("!AIVDM")) {
        console.error("Unrecognised AIS message: ", input);
        return;
    }

    const lines = input.trim().split(/\r?\n/);

    // Assuming we only get single messages or doubles together:
    //  !AIVDM,1,1,...
    //
    //  !AIVDM,2,1,...
    //  !AIVDM,2,2,...
    const data = lines.map(line => {
        const [ type, totalFragments, fragmentNo, sequentialID, channel, data, check ] = line.split(",");
        return data;
    }).join("");

    // console.log(data);

    const dd = [...data].map(c => {
        let v = c.charCodeAt(0);
        v -= 48;
        if (v > 40) {
            v -= 8;
        }
        return v;
    });

    // console.log(dd);

    const messageType = dd[0];
    if (messageType === 1 || messageType === 2 || messageType === 3) {
        const repeatIndicator = dd[1] >> 4;
        const mmsi = ((dd[1] & 0x0F) << 26) |   // 4
                    (dd[2] << 20) |             // 10
                    (dd[3] << 14) |             // 16
                    (dd[4] << 8) |              // 22
                    (dd[5] << 2) |              // 28
                    (dd[6] >> 4);               // 30
        const navigationStatus = dd[6] & 0x0F;
        const rateOfTurnSign = (dd[7] >> 5);
        const rateOfTurnRaw = ((dd[7] & 0x1F) << 2) | (dd[8] >> 4);
        const rateOfTurn = rateOfTurnRaw === 0x80 ? 0 : (rateOfTurnSign ? -1 : 1) * Math.pow(rateOfTurnRaw / 4.733, 2)
        const speedOverGroundRaw = ((dd[8] & 0x0F) << 6) | dd[9];
        const speedOverGround = speedOverGroundRaw / 10;
        const accuracy = dd[10] >> 5;
        const longitudeRaw = ((dd[10] & 0x1F) << 23) | (dd[11] << 17) | (dd[12] << 11) | (dd[13] << 5) | (dd[14] >> 1);
        const longitude = longitudeRaw / 6e5;
        const latitudeRaw = ((dd[14] & 0x01) << 26) | (dd[15] << 20) | (dd[16] << 14) | (dd[17] << 8) | (dd[18] << 2) | (dd[19] >> 4);
        const latitude = latitudeRaw / 6e5;
        const courseOverGroundRaw = ((dd[19] & 0x0F) << 8) | (dd[20] << 2) | (dd[21] >> 4);
        const courseOverGround = courseOverGroundRaw / 10;
        const trueHeading = ((dd[21] & 0x0F) << 5) | (dd[22] >> 1);
        const timestamp = ((dd[22] & 0x01) << 5) | (dd[23] >> 1);
        const maneuverIndicator = ((dd[23] & 0x01) << 1) | (dd[24] >> 5);

        console.log({ messageType, rateOfTurnSign, rateOfTurnRaw, speedOverGroundRaw, longitudeRaw, latitudeRaw, courseOverGroundRaw });

        const message = {
            type: messageType,
            repeatIndicator,
            mmsi,
            navigationStatus,
            rateOfTurn,
            speedOverGround,
            accuracy,
            longitude,
            latitude,
            courseOverGround,
            trueHeading,
            timestamp,
            maneuverIndicator,
        };

        return message;
    }
    // const year = (dd[7] << 8) | (dd[8] << 2) | (dd[9] >> 4);
    // const month = dd[9] & 0x0F;
    // const day = dd[10] >> 1;
    // const hour = ((dd[10] & 0x01) << 4) | (dd[11] >> 2);
    // const minute = (dd[11] & 0x0F) << 4 | (dd[12] >> 2);
    // const second = (dd[12] & 0x0F) << 4 | (dd[13] >> 2);
    // const p2 = n => n.toString().padStart(2,"0");
    // const reportDate = `${year}-${p2(month)}-${p2(day)}T${p2(hour)}:${p2(minute)}:${p2(second)}`;
    // const accuracy = dd[14]

    return {
        type: messageType,
    };
}

/**
 * @param {Vessel} vessel
 */
export function getVesselColours (vessel) {
    switch (vessel.navigationStatus) {
        case 0: // Underway using engine
            return [ "#080", "#8f8" ];
        case 1: // At anchor
            return [ "#840", "#fC8" ];
        case 2: // Not under command
            return [ "#808", "#f8f" ];
        case 3: // Restricted maneuverability
            return [ "#840", "#f80" ];
        case 4: // Constraigned by draught
            return [ "#848", "#fcf" ];
        case 5: // Moored
            return [ "#800", "#f88" ];
        case 8: // Sailing
            return [ "#00f", "#88f" ];
        case 15: // Undefined/Default
            return [ "#333", "#FFF" ];
        case 6: // Aground
        case 7: // Fishing
        default:
            return [ "#000", "#888" ];
    }
}

export class WSAIS {
    /** @type {((message: Vessel) => void)[]} */
    #listeners = [];
    #socket = null;

    /**
     * @param {(message: Vessel) => void} listener
     */
    addListener (listener) {
        this.#listeners.push(listener);

        if (!this.#socket) {
            this.#start();
        }
    }

    /**
     * @param {(message: Vessel) => void} listener
     */
    removeListener (listener) {
        this.#listeners = this.#listeners.filter(l => l !== listener);

        if (this.#listeners.length === 0) {
            this.#stop();
        }
    }

    #start () {
        if (this.#socket) {
            return;
        }

        // Create WebSocket connection.
        this.#socket = new WebSocket('wss://passage.ijmacd.com/wsais');

        // Listen for messages
        this.#socket.addEventListener('message', (event) => {
            /** @type {Blob} */
            const data = event.data;

            if (data.size > 2) {
                data.text().then(t => {
                    console.log(t);
                    const result = decodeRawMessage(t);

                    for (const listener of this.#listeners) {
                        listener(result);
                    }
                });
            }
        });
    }

    #stop () {
        this.#socket.close();
        this.#socket = null;
    }
}

/**
 *
 * @param {Vessel[][]} sets
 */
export function combineAIS (sets) {
    /** @type {Map<number, Vessel>} */
    const map = new Map();

    for (const set of sets) {
        for (const v of set) {
            // Copy name if we can find it already set
            if (map.has(v.mmsi) && !v.name) {
                const { name } = map.get(v.mmsi);
                if (name) v.name = name;
            }

            map.set(v.mmsi, v);
        }
    }

    return [...map.values()];
}