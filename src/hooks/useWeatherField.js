import { useEffect, useState } from "react";
import { getForecastURLByStation, getNearestStations } from "../util/weather.js";

/**
 * @param {[longitude: number, latitude: number]} centre
 */
export function useWeatherField (centre) {
    const [ weatherField, setWeatherField ] = useState(/** @type {{ weather: import("../util/weather.js").WeatherResponse; distance: number; loc: string; lat: number; lon: number; }[]} */([]));

    useEffect(() => {
        let current = true;

        const stations = getNearestStations(centre, 3);

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
    }, [centre]);

    return weatherField;
}
