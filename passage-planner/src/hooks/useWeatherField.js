import { useEffect, useState } from "react";
import { ALL_STATION_LOCATIONS, getForecastURLByStation, getNearestStations } from "../util/weather.js";
import { filterByBounds, getBounds } from "../util/projection.js";
import { latlon2nm } from "../util/geo.js";

/**
 * @param {import("../Components/StaticMap.jsx").StaticMapContextValue} context
 */
export function useWeatherField ({ centre, zoom, width, height }) {
    const [ weatherField, setWeatherField ] = useState(/** @type {{ weather: import("../util/weather.js").WeatherResponse; distance: number; loc: string; lat: number; lon: number; }[]} */([]));

    useEffect(() => {
        let current = true;

        const bounds = getBounds({ centre, zoom, width, height });

        let stations = ALL_STATION_LOCATIONS
            .filter(filterByBounds(bounds))
            .map(s => ({
                ...s,
                distance: latlon2nm(s, { lon: centre[0], lat: centre[1] }),
            }));

        if (stations.length === 0) {
            stations = getNearestStations(centre, 3);
        }

        const promises = stations.map(station =>
            fetch(getForecastURLByStation(station.loc))
                .then(r => r.json())
        );

        Promise.all(promises)
            .then(/** @param {(import("../util/weather.js").WeatherResponse)[]} responses */ responses => {
                if (current) {
                    const results = stations.map((station, i) => ({ ...station, weather: responses[i] }));
                    setWeatherField(results);
                }
            });

        return () => { current = false; };
    }, [centre, zoom, width, height]);

    return weatherField;
}
