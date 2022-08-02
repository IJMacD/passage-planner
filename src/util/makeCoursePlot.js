/**
 * @typedef {import("./gpx").Point} Point
 */

/**
 * @typedef {{from: Point; to: Point; distance: number; heading: number; duration: number}} TrackLeg
 */

/**
 * @param {TrackLeg[]} legs
 * @param {(leg: TrackLeg) => number} mapFn
 * @param {number} divisions
 * @param {boolean} average average or sum mode
 * @returns {[number, number][]}
 */
export function makeCoursePlot(legs, mapFn, divisions = 24, average = false) {
    /** @type {number[]} */
    const out = Array.from({ length: divisions }).fill(0);
    const n = Array.from({ length: divisions }).fill(0);
    const theta = 360 / divisions;

    for (const leg of legs) {
        let index = Math.floor((leg.heading + theta / 2) / theta);
        if (index >= divisions)
            index = 0;

        out[index] += mapFn(leg);
        n[index]++;
    }

    return out.map((v, i) => [i * theta, average ? (v / n[i]) || 0 : v]);
}
