import { useMemo } from "react";
import { formatDateTimeCompact } from "../util/date";
import { useFetch } from "./useFetch";

const tidesJsonURL = `https://passage.ijmacd.com/tides/data/static_geojson.php?mode=S&time=`

/**
 * @param {Date} time
 */
export function useTides (time) {
    const fifteenMinOffset = +time % (15 * 60 * 1000);
    const roundedDate = new Date(+time - fifteenMinOffset);

    const [tideJSON] = useFetch(tidesJsonURL + formatDateTimeCompact(roundedDate, ""));

    const tideVectors = useMemo(() => {
        if (!tideJSON) return null;
        return tideJSON.features.map(feature => ({ latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0], magnitude: +feature.properties.knot, direction: +feature.properties.deg }));
    }, [tideJSON]);

    return tideVectors;
}
