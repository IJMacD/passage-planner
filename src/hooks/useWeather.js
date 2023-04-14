import { useEffect, useState } from "react";
import { getForecastURL } from "../util/weather.js";

/**
 * @param {[longitude: number, latitude: number]} centre
 */
export function useWeather (centre) {
    const [ weather, setWeather ] = useState(/** @type {import("../util/weather").WeatherResponse?} */(null));

    useEffect(() => {
        fetch(getForecastURL(centre))
          .then(r => r.json())
          .then(setWeather);
    }, [centre]);

    return weather;
}
