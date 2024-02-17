
const CHAR_MAP = `@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_ !"#$%&'()*+,-./0123456789:;<=>?`;

/**
 * @typedef {{type: number;repeatIndicator: number;mmsi: number;[field: string]: any}} AISReport
 */
/**
 * @see https://gpsd.gitlab.io/gpsd/AIVDM.html
 * @param {string} input
 * @returns {AISReport?}
 */

let multipartCache = "";

/**
 * @param {string} input
 */
export function decodeRawMessage (input) {
    if (!input.startsWith("!AIVDM")) {
        console.error("Unrecognised AIS message: ", input);
        return null;
    }

    let [type, totalFragments, fragmentNo, sequentialID, channel, data, check] = input.split(",");

    if (+totalFragments > 1) {
        multipartCache += data;

        if (+fragmentNo < +totalFragments) {
            return null;
        }

        data = multipartCache;
        multipartCache = "";
    }

    return decodeRawMessageData(data);
}

/**
 * @param {string} data
 * @return {AISReport?}
 */
export function decodeRawMessageData (data) {
    // console.log(data);
    const dd = getDecodedDataBits(data);

    // console.log(dd);
    // dd is groups of 6 bit values
    // 4x 6 bit values = 3x 8 bit values
    // [0]: 0 1 2 3 4 5  00..05   0 . . . . .
    // [1]: 6 7 0 1 2 3  06..11   . . 0 . . .
    // [2]: 4 5 6 7 0 1  12..17   . . . . 0 .
    // [3]: 2 3 4 5 6 7  18..23   . . . . . .
    // [4]: 0 1 2 3 4 5  24..29
    // [5]: 6 7 0 1 2 3  30..35
    // [6]: 4 5 6 7 0 1  36..41
    // [7]: 2 3 4 4 5 6  42..47

    const { mmsi, messageType, repeatIndicator } = getMessageBasics(dd);

    if (messageType === 1 || messageType === 2 || messageType === 3) {
        // Spec: https://gpsd.gitlab.io/gpsd/AIVDM.html#_types_1_2_and_3_position_report_class_a
        const navigationStatus = dd[6] & 0x0F;
        const rateOfTurnSign = (dd[7] >> 5);
        const rateOfTurnRaw = ((dd[7] & 0x1F) << 2) | (dd[8] >> 4);
        const rateOfTurn = rateOfTurnRaw === 0x80 ? 0 : (rateOfTurnSign ? -1 : 1) * Math.pow(rateOfTurnRaw / 4.733, 2);
        const speedOverGroundRaw = ((dd[8] & 0x0F) << 6) | dd[9];
        /** @type {number|undefined} */
        let speedOverGround = speedOverGroundRaw / 10;
        const accuracy = dd[10] >> 5;
        const longitudeRaw = ((dd[10] & 0x1F) << 23) | (dd[11] << 17) | (dd[12] << 11) | (dd[13] << 5) | (dd[14] >> 1);
        const longitude = longitudeRaw / 6e5;
        const latitudeRaw = ((dd[14] & 0x01) << 26) | (dd[15] << 20) | (dd[16] << 14) | (dd[17] << 8) | (dd[18] << 2) | (dd[19] >> 4);
        const latitude = latitudeRaw / 6e5;
        const courseOverGroundRaw = ((dd[19] & 0x0F) << 8) | (dd[20] << 2) | (dd[21] >> 4);
        /** @type {number|undefined} */
        let courseOverGround = courseOverGroundRaw / 10;
        /** @type {number|undefined} */
        let trueHeading = ((dd[21] & 0x0F) << 5) | (dd[22] >> 1);
        const timestamp = ((dd[22] & 0x01) << 5) | (dd[23] >> 1);
        const manoeuvreIndicator = ((dd[23] & 0x01) << 1) | (dd[24] >> 5);

        // console.log({ messageType, rateOfTurnSign, rateOfTurnRaw, speedOverGroundRaw, longitudeRaw, latitudeRaw, courseOverGroundRaw });
        if (longitude === 181 || latitude === 91) {
            // Station doesn't know its own location
            // There might still be some useful information but there's not much
            // we can do without the location
            return null;
        }

        if (longitude === 0 && latitude === 0) {
            // Almost certainly bad data
            return null;
        }

        if (speedOverGround === 102.3) {
            speedOverGround = undefined;
        }

        if (courseOverGround === 360.0) {
            courseOverGround = undefined;
        }

        if (trueHeading === 511) {
            trueHeading = undefined;
        }

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
            manoeuvreIndicator,
        };

        return message;
    }

    // console.log({ type: messageType, });
    if (messageType === 4) {
        // Spec: https://gpsd.gitlab.io/gpsd/AIVDM.html#_type_4_base_station_report
        // console.log(dd);
        const year = (dd[7] << 8) | (dd[8] << 2) | (dd[9] >> 4);
        const month = dd[9] & 0x0F;
        const day = dd[10] >> 1;
        const hour = ((dd[10] & 0x01) << 4) | (dd[11] >> 2);
        const minute = ((dd[11] & 0x0F) << 4) | (dd[12] >> 2);
        const second = ((dd[12] & 0x0F) << 4) | (dd[13] >> 2);
        const p2 = n => n.toString().padStart(2, "0");
        const reportDate = `${year}-${p2(month)}-${p2(day)}T${p2(hour)}:${p2(minute)}:${p2(second)}`;
        const accuracy = dd[14];

        const message = {
            type: messageType,
            repeatIndicator,
            mmsi,
            year,
            month,
            day,
            hour,
            minute,
            second,
            reportDate,
            accuracy,
        };

        console.log(message);

        return message;
    }

    if (messageType === 5) {
        // Spec: https://gpsd.gitlab.io/gpsd/AIVDM.html#_type_5_static_and_voyage_related_data
        // console.log(input);
        // console.log(dd);
        // bits 38 - 39
        const aisVersion = (dd[6] >> 2) & 0x03;
        // bits 40 - 69
        //  6:             40 41
        //  7: 42 43 44 45 46 47
        //  8: 48 49 50 51 52 53
        //  9: 54 55 56 57 58 59
        // 10: 60 61 62 63 64 65
        // 11: 66 67 68 69
        const imoNumber = ((dd[6] & 0x03) << 28) |
            (dd[7] << 22) |
            (dd[8] << 16) |
            (dd[9] << 10) |
            (dd[10] << 4) |
            (dd[11] >> 2);

        // bits 70 - 111
        const callSign = getChars(dd, 70, 111);

        // bits 112 - 231
        const name = getChars(dd, 112, 231).trim();

        // bits 232 - 239
        // 38: 228 229 230 231 232 233
        // 39: 234 235 236 237 238 239
        const shipType = ((dd[38] & 0x03) << 6) | dd[39];

        // bits 240 - 248
        // 40: 240 241 242 243 244 245
        // 41: 246 247 248 249 250 251
        const dimensionToBow = (dd[40] << 3) | (dd[42] >> 3);

        // bits 249 - 257
        // 41: 246 247 248 249 250 251
        // 42: 252 253 254 255 256 257
        const dimensionToStern = ((dd[41] & 0x03) << 6) | dd[42];

        // bits 258 - 263
        const dimensionToPort = dd[43];

        // bits 264 - 269
        const dimensionToStarboard = dd[44];

        // bits 270 - 273
        const fixType = dd[45] >> 2;

        // bits 274 - 277
        const etaMonth = ((dd[45] & 0x03) << 2) | (dd[46] >> 4);

        // bits 278 - 282
        // 46: 276 277 278 279 280 281
        // 47: 282 283 284 285 286 287
        const etaDay = ((dd[46] & 0x0F) << 1) | (dd[47] >> 5);

        // bits 283 - 287
        const etaHour = (dd[47] & 0x1F);

        // bits 288 - 293
        const etaMinute = dd[48];

        // bits 294 - 301
        const draught = ((dd[49] << 2) | (dd[50] >> 4)) / 10;

        // bits 302 - 421
        const destination = getChars(dd, 302, 421).trim();

        // console.log(getChars(dd, 302, 421));
        const message = {
            type: messageType,
            repeatIndicator,
            mmsi,
            aisVersion,
            imoNumber,
            callSign,
            name,
            shipType,
            dimensionToBow,
            dimensionToStern,
            dimensionToPort,
            dimensionToStarboard,
            fixType,
            etaMonth,
            etaDay,
            etaHour,
            etaMinute,
            draught,
            destination,
        };

        // console.log(message);
        return message;
    }

    if (messageType === 15) {
        // "Interrogation" message
    }

    // Different method of parsing: Convert the data to one long string of
    // binary digits and use substring to get the slices required.

    const binary = dd.map(n => n.toString(2).padStart(6, "0")).join("");

    if (messageType === 18) {

        const speedOverGroundRaw = parseInt(binary.substring(46, 56), 2);
        /** @type {number|undefined} */
        let speedOverGround = speedOverGroundRaw / 10;
        if (speedOverGround === 102.3) {
            speedOverGround = undefined;
        }

        const accuracy = parseInt(binary.substring(56, 57), 2);

        const longitude = parseInt(binary.substring(57, 85), 2) / 600000;
        const latitude = parseInt(binary.substring(85, 112), 2) / 600000;

        const courseOverGroundRaw = parseInt(binary.substring(112, 124), 2);
        /** @type {number|undefined} */
        let courseOverGround = courseOverGroundRaw / 10;
        if (courseOverGround === 360) {
            courseOverGround = undefined;
        }

        const trueHeadingRaw = parseInt(binary.substring(124, 133), 2);
        /** @type {number|undefined} */
        let trueHeading = trueHeadingRaw;
        if (trueHeading === 511) {
            trueHeading = undefined;
        }

        const timestamp = parseInt(binary.substring(133, 139), 2);

        return {
            type: messageType,
            repeatIndicator,
            mmsi,
            speedOverGround,
            accuracy,
            longitude,
            latitude,
            courseOverGround,
            trueHeading,
            timestamp,
        };
    }

    if (messageType === 19) {

        const speedOverGroundRaw = parseInt(binary.substring(46, 56), 2);
        /** @type {number|undefined} */
        let speedOverGround = speedOverGroundRaw / 10;
        if (speedOverGround === 102.3) {
            speedOverGround = undefined;
        }

        const accuracy = parseInt(binary.substring(56, 57), 2);

        const longitude = parseInt(binary.substring(57, 85), 2) / 600000;
        const latitude = parseInt(binary.substring(85, 112), 2) / 600000;

        const courseOverGroundRaw = parseInt(binary.substring(112, 124), 2);
        /** @type {number|undefined} */
        let courseOverGround = courseOverGroundRaw / 10;
        if (courseOverGround === 360) {
            courseOverGround = undefined;
        }

        const trueHeadingRaw = parseInt(binary.substring(124, 133), 2);
        /** @type {number|undefined} */
        let trueHeading = trueHeadingRaw;
        if (trueHeading === 511) {
            trueHeading = undefined;
        }

        const timestamp = parseInt(binary.substring(133, 139), 2);

        const name = [...binary.substring(143, 263).matchAll(/\d{6}/g)].map(m => CHAR_MAP[parseInt(m[0], 2)]).join("").trim().replace(/@+$/, "");

        const shipType = parseInt(binary.substring(263, 271), 2);

        const dimensionToBow = parseInt(binary.substring(271, 280), 2);
        const dimensionToStern = parseInt(binary.substring(280, 289), 2);
        const dimensionToPort = parseInt(binary.substring(289, 295), 2);
        const dimensionToStarboard = parseInt(binary.substring(295, 301), 2);

        const fixType = parseInt(binary.substring(301, 305), 2);

        return {
            type: messageType,
            repeatIndicator,
            mmsi,
            speedOverGround,
            accuracy,
            longitude,
            latitude,
            courseOverGround,
            trueHeading,
            timestamp,
            name,
            shipType,
            dimensionToBow,
            dimensionToStern,
            dimensionToPort,
            dimensionToStarboard,
            fixType,
        };
    }

    return {
        type: messageType,
        repeatIndicator,
        mmsi,
        data: dd,
    };
}

/**
 * @param {number[]} dd
 */
function getMessageBasics(dd) {
    // bits 0 - 5
    const messageType = dd[0];

    // bits 6 - 7
    const repeatIndicator = dd[1] >> 4;

    // bits 8 - 37
    const mmsi = ((dd[1] & 0x0F) << 26) | // 4
        (dd[2] << 20) | // 10
        (dd[3] << 14) | // 16
        (dd[4] << 8) | // 22
        (dd[5] << 2) | // 28
        (dd[6] >> 4); // 30

    return { mmsi, messageType, repeatIndicator };
}

/**
 * @param {number[]} dd nibbles
 * @param {number} firstBit
 * @param {number} lastBit
 */
function getChars(dd, firstBit, lastBit) {
    const mod = firstBit % 6;

    if (lastBit % 6 !== (mod + 5) % 6) {
        throw Error("Last bit doesn't match first bit");
    }

    const b1 = Math.floor(firstBit / 6);
    const bn = Math.floor(lastBit / 6);

    const chars = [];
    for (let i = b1; i < bn; i++) {
        let index;

        if (mod === 0) {
            index = dd[i];
        }
        else if (mod === 2) {
            index = ((dd[i] & 0x0F) << 2) | (dd[i + 1] >> 4);
        }
        else if (mod === 4) {
            index = ((dd[i] & 0x03) << 4) | (dd[i + 1] >> 2);
        }
        else {
            throw Error("Wasn't expecting to be so generic");
        }

        if (index === 0) {
            break;
        }

        chars.push(CHAR_MAP[index]);
    }

    const msg = chars.join("");

    // '@' character is like nul byte
    return msg.trim().replace(/@+$/, "");
}

/**
 * @param {string} data
 */
function getDecodedDataBits (data) {
    return [...data].map(c => {
        let v = c.charCodeAt(0);
        v -= 48;
        if (v > 40) {
            v -= 8;
        }
        return v;
    });
}