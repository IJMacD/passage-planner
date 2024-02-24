import { useEffect, useState } from "react";
import { getHistoricalWeatherAtStation } from "../util/historicalWeather.js";


/**
 * @typedef {Object} HistoricalWeather
 * @property {string} dateString
 * @property {string} stationName
 * @property {number} windDirection
 * @property {number} windSpeed
 * @property {number} windGusts
 */

/**
 * @param {string} station
 * @param {Date} time
 */
export function useHistoricalWeather(station, time) {
    const roundedTime = +time - +time % (10 * 60 * 1000);
    const [historicalWeather, setHistoricalWeather] = useState(/** @type {HistoricalWeather?} */(null));
    useEffect(() => {
        getHistoricalWeatherAtStation(time, station)
            .then(setHistoricalWeather);
    }, [station, roundedTime]);

    return historicalWeather;
}