import { useMemo } from "react";
import { formatDateTimeCompact } from "../util/date.js";
import { useFetch } from "./useFetch.js";

const tidesJsonURL = `/tides/data/static_geojson.php?mode=S&time=`;

/**
 * @param {Date} time
 */
export function useTidalCurrents(time) {
  const fifteenMinOffset = +time % (15 * 60 * 1000);
  const roundedDate = new Date(+time - fifteenMinOffset);

  const [tideJSON] = useFetch(
    tidesJsonURL + formatDateTimeCompact(roundedDate, "")
  );

  /** @type {import("../Layers/VectorFieldLayer.jsx").PolarFieldPoint[]} */
  const tideVectors = useMemo(() => {
    if (!tideJSON) return [];
    return tideJSON.features.map((feature) => ({
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      magnitude: +feature.properties.knot,
      direction: +feature.properties.deg,
    }));
  }, [tideJSON]);

  return tideVectors;
}
