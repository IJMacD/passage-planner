/**
 * @param {{ from: import("./gpx").Point; to: import("./gpx").Point; distance: number; heading: number; }[]} legs
 * @returns {[number, number][]}
 */
export function makeCoursePlot(legs, divisions = 24) {
    const out = Array.from({ length: divisions }).fill(0);
    const theta = 360 / divisions;

    for (const leg of legs) {
        let index = Math.floor((leg.heading + theta / 2) / theta);
        if (index >= divisions)
            index = 0;

        out[index] += leg.distance;
    }

    return out.map((v, i) => [i * theta, v]);
}
