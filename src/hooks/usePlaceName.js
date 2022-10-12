import { useEffect, useState } from "react";

/**
 * @param {import("../util/gpx").Point} point
 */
async function fetchPlaceName(point) {
    const zoom = 14;
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lon}&format=jsonv2&zoom=${zoom}`);
    const data = await r.json();
    return `${data.address.county}, ${data.address.state}`;
}

/**
 *
 * @param {import("../util/gpx").Point} point
 */
export function usePlaceName ({ lon, lat }) {
    const [ placeName, setPlaceName ] = useState("");

    useEffect(() => {
        fetchPlaceName({ lon, lat }).then(setPlaceName);
    }, [lon, lat]);

    return placeName;
}