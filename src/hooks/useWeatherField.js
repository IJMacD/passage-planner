import { useEffect, useState } from "react";
import { ALL_STATION_LOCATIONS, getForecastURLByStation } from "../util/weather.js";
import { filterByBounds, getBounds } from "../util/projection.js";
import { latlon2nm } from "../util/geo.js";

/**
 * @param {import("../Components/StaticMap.js").StaticMapContextValue} context
 */
export function useWeatherField (context) {
    const [ weatherField, setWeatherField ] = useState(/** @type {{ weather: import("../util/weather.js").WeatherResponse; distance: number; loc: string; lat: number; lon: number; }[]} */([]));

    useEffect(() => {
        let current = true;

        const bounds = getBounds(context);

        const centre = { lon: context.centre[0], lat: context.centre[1] };

        const stations = ALL_STATION_LOCATIONS
            .filter(filterByBounds(bounds))
            .map(s => ({
                ...s,
                distance: latlon2nm(s, centre),
            }));

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
    }, [context]);

    return weatherField;
}
