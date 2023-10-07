import { useEffect, useState } from "react";
import { ALL_TIDE_STATIONS_INFO } from "../util/weather.js";

/**
 * @typedef TideStation
 * @property {string} code
 * @property {string} name
 * @property {number} longitude
 * @property {number} latitude
 */

/**
 * @typedef TideStationDailyRecord
 * @property {TideStation} station
 * @property {number[]} heights
 */
/**
 * @typedef TideStationRecord
 * @property {TideStation} station
 * @property {number} hour
 * @property {number} height
 * @property {number} dHeight
 */

/**
 *
 * @param {Date} date
 * @param {[number, number, number, number]} bounds
 */
export function useTides(date, bounds) {
    const [west, south, east, north] = bounds;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = Math.round(date.getHours() + date.getMinutes() / 60);

    const [tideStationDailyRecords, setTideStationDailyRecords] = useState(/** @type {TideStationDailyRecord[]} */([]));

    useEffect(() => {
        let isCurrent = true;

        const allTideStations = Object.keys(ALL_TIDE_STATIONS_INFO);
        const stationsInBounds = /** @type {(keyof ALL_TIDE_STATIONS_INFO)[]} */(allTideStations.filter(sta => {
            const info = ALL_TIDE_STATIONS_INFO[sta];
            const lon = info.latlon[0];
            const lat = info.latlon[1];
            return lon >= west && lon <= east && lat >= south && lat <= north;
        }));

        Promise.all(stationsInBounds.map(async sta => {
            const url = `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HHOT&station=${sta}&year=${year}&month=${month}&day=${day}&rformat=json`;
            const info = ALL_TIDE_STATIONS_INFO[sta];
            const station = {
                code: sta,
                name: info.name,
                longitude: info.latlon[0],
                latitude: info.latlon[1],
            };

            try {
                const r = await fetch(url);
                const d = await r.json();
                return {
                    station: station,
                    heights: d.data[0].slice(2),
                };
            } catch {
                return ({ station, heights: [] });
            }
        })).then(tideStationDailyRecords => {
            if (isCurrent) {
                setTideStationDailyRecords(tideStationDailyRecords);
            }
        });

        return () => { isCurrent = false; };
    }, [west, south, east, north, year, month, day]);

    /** @type {TideStationRecord[]} */
    const tideStationRecords = tideStationDailyRecords.map(record => ({
        station: record.station,
        hour,
        height: record.heights[hour],
        // Average derivative of tide height at hour
        dHeight: (record.heights[hour + 1] - record.heights[hour - 1]) / 2,
    }));

    return tideStationRecords;
}
