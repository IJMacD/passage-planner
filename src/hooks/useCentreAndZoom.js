import { useEffect, useState } from "react";
import { getBoundingBox } from "../util/geo";

/**
 * @typedef {{centre: [number, number];zoom: number;}} CentreAndZoom
 */
/**
 * @param {import("../util/gpx").Track | null} track
 * @returns {[CentreAndZoom, React.Dispatch<React.SetStateAction<CentreAndZoom>>]}
 */
export function useCentreAndZoom(track) {
    const [centreAndZoom, setCentreAndZoom] = useState(/** @type {CentreAndZoom} */({ centre: [0, 0], zoom: 6 }));

    useEffect(() => {
        const trackPoints = track ? track.segments.flat() : [];

        setCentreAndZoom(getCentreAndZoom(trackPoints));
    }, [track]);

    return [centreAndZoom, setCentreAndZoom];
}
/**
 * @param {import("../util/gpx").Point[]} points
 * @returns {CentreAndZoom}
 */
function getCentreAndZoom(points) {
    const bbox = getBoundingBox(points);

    /** @type {[number, number]} */
    const centre = [
        (bbox[0] + bbox[2]) / 2,
        (bbox[1] + bbox[3]) / 2,
    ];

    const lonRange = bbox[2] - bbox[0];
    const latRange = bbox[3] - bbox[1];

    const maxRange = Math.max(lonRange, latRange);
    const zoom = Math.floor(Math.log2(360 / maxRange)) + 1;

    return { centre, zoom };
}
