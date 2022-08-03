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
 * @param {"sum"|"average"|"min"|"max"} mode
 * @returns {[number, number][]}
 */
export function makeCoursePlot(legs, mapFn, divisions = 24, mode = "sum") {
    let initialValue = 0;

    if (mode === "min") {
        initialValue = Number.POSITIVE_INFINITY;
    }

    /** @type {number[]} */
    const out = Array.from({ length: divisions }).fill(initialValue);
    const n = Array.from({ length: divisions }).fill(0);
    const theta = 360 / divisions;

    for (const leg of legs) {
        if (!isNaN(leg.heading)) {
            let index = Math.floor((leg.heading + theta / 2) / theta);
            if (index >= divisions)
                index = 0;

            const val = mapFn(leg);
            if (!isNaN(val)) {
                if (mode === "max") {
                    out[index] = Math.max(out[index], val);
                }
                else if (mode === "min") {
                    out[index] = Math.min(out[index], val);
                }
                else {
                    out[index] += val;
                    n[index]++;
                }
            }
        }
    }

    return out.map((v, i) => [i * theta, mode === "average" ? (v / n[i]) || 0 : v]);
}
