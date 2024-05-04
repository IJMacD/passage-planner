import { useMemo } from "react";
import { getBoundingBox } from "../util/geo.js";

/**
 * @typedef {{centre: [number, number];zoom: number;}} CentreAndZoom
 */
/**
 * @param {import("../util/gpx.js").Track | null} track
 * @returns {CentreAndZoom}
 */
export function useCentreAndZoom(track) {
    return useMemo(() => {
        if (!track || track.segments.length === 0) {
            return { centre: [0, 0], zoom: 2 };
        }

        const trackPoints = track.segments.flat();

        return getCentreAndZoom(trackPoints);
    }, [track]);
}

/**
 * @param {import("../util/gpx.js").Point[]} points
 * @returns {CentreAndZoom}
 */
export function getCentreAndZoom(points) {
    const bbox = getBoundingBox(points);

    if (bbox.some(n => !isFinite(n))) {
        return { centre: [0, 0], zoom: 2 };
    }

    /** @type {[number, number]} */
    const centre = [
        (bbox[0] + bbox[2]) / 2,
        (bbox[1] + bbox[3]) / 2,
    ];

    const lonRange = bbox[2] - bbox[0];
    const latRange = bbox[3] - bbox[1];

    const maxRange = Math.max(lonRange, latRange);
    const zoom = Math.ceil(Math.log2(360 / maxRange));

    return { centre, zoom };
}
