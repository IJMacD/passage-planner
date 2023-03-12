import { useMemo } from "react";
import { getBoundingBox } from "../util/geo";

/**
 * @typedef {{centre: [number, number];zoom: number;}} CentreAndZoom
 */
/**
 * @param {import("../util/gpx").Track | null} track
 * @returns {CentreAndZoom}
 */
export function useCentreAndZoom(track) {
    return useMemo(() => {
        if (!track) {
            return { centre: [0,0], zoom: 0 };
        }

        const trackPoints = track.segments.flat();

        return getCentreAndZoom(trackPoints);
    }, [track]);
}

/**
 * @param {import("../util/gpx").Point[]} points
 * @returns {CentreAndZoom}
 */
export function getCentreAndZoom(points) {
    const bbox = getBoundingBox(points);

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
