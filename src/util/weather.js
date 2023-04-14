import { latlon2nm } from "./geo.js";

export const ALL_STATIONS = ["CCH", "HKA", "HKO", "HKS", "JKB", "LFS", "PEN", "SEK", "SHA", "SKG", "TKL", "TPO", "TUN", "TY1", "WGL", "SSH" ];
// ALL STATIONS: ['CCH', 'HKA', 'HKO', 'HKS', 'JKB', 'LFS', 'PEN', 'SEK', 'SHA', 'SKG', 'TKL', 'TPO', 'TUN', 'TY1', 'WGL', 'SSH', 'DF3647', 'GF3640', 'ARWF_MKA', 'ARWF_SFY', 'ARWF_TWS', 'ARWF_TIT', 'ARWF_CCC', 'ARWF_CYS']

// Updated by /scripts/getWeatherStationLocations.js
export const ALL_STATION_LOCATIONS = [{loc:"CCH",lat:22.201,lon:114.027},{loc:"HKA",lat:22.309,lon:113.922},{loc:"HKO",lat:22.302,lon:114.174},{loc:"HKS",lat:22.245,lon:114.174},{loc:"JKB",lat:22.316,lon:114.256},{loc:"LFS",lat:22.469,lon:113.984},{loc:"PEN",lat:22.291,lon:114.043},{loc:"SEK",lat:22.436,lon:114.085},{loc:"SHA",lat:22.403,lon:114.21},{loc:"SKG",lat:22.376,lon:114.274},{loc:"TKL",lat:22.529,lon:114.157},{loc:"TPO",lat:22.4482,lon:114.177},{loc:"TUN",lat:22.386,lon:113.964},{loc:"TY1",lat:22.3443,lon:114.11},{loc:"WGL",lat:22.182,lon:114.303},{loc:"SSH",lat:22.502,lon:114.111}]

/**
 * @typedef DailyForecast
 * @prop {string} ForecastDate
 * @prop {string} ForecastChanceOfRain
 * @prop {number} ForecastDailyWeather
 * @prop {number} ForecastMaximumTemperature
 * @prop {number} ForecastMinimumTemperature
 */

/**
 * @typedef HourlyForecast
 * @prop {string} ForecastHour
 * @prop {number} ForecastTemperature
 * @prop {number} ForecastRelativeHumidity
 * @prop {number} ForecastWindSpeed
 * @prop {number} ForecastWindDirection
 */

/**
 * @typedef WeatherResponse
 * @prop {number} LastModified
 * @prop {string} StationCode
 * @prop {number} Latitude
 * @prop {number} Longitude
 * @prop {number} ModelTime
 * @prop {DailyForecast[]} DailyForecast
 * @prop {HourlyForecast[]} HourlyWeatherForecast
 */

/**
 * @param {[ longitude: number, latitude: number ]} centre
 */
export function getForecastURL (centre) {
    const allStations = ALL_STATION_LOCATIONS.map(station => {
        const distance = latlon2nm({lon:centre[0],lat:centre[1]}, station);
        return { ...station, distance };
    });

    allStations.sort((a, b) => a.distance - b.distance);

    const nearest = allStations[0];

    return getForecastURLByStation(nearest.loc);
}

/**
 * @param {string} loc
 */
export function getForecastURLByStation (loc) {
    // return `https://passage.ijmacd.com/weather/ocf/dat/${loc}.xml`;
    return `https://passage.ijmacd.com/weather_forecast.php?location=${loc}`;
}

/**
 * Find the closest hourly forecast
 * @param {WeatherResponse} weather
 * @param {Date} time
 */
export function findForecast (weather, time) {
    const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
    const timeString = dateFormat(d, "%Y%M%D%h");
    return weather.HourlyWeatherForecast.find(f => f.ForecastHour === timeString) || null;
}

/**
 * @param {Date} d
 * @param {string} f
 */
function dateFormat (d, f) {
    return f.replace(/%\w/gi, s => {
        switch (s) {
            case '%Y': return d.getFullYear().toString().padStart(4, "0");
            case '%M': return (d.getMonth()+1).toString().padStart(2, "0");
            case '%D': return d.getDate().toString().padStart(2, "0");
            case '%h': return d.getHours().toString().padStart(2, "0");
            case '%m': return d.getMinutes().toString().padStart(2, "0");
            case '%s': return d.getSeconds().toString().padStart(2, "0");
            default: return s;
        }
    });
}


export function getPointOfSail(heading, windDirection) {
    const delta = (heading - windDirection + 180) % 360 - 180;
    const theta = Math.abs(delta);

    let tack = delta > 0 ? "Port" : "Starboard";
    let label;

    if (theta < 45) {
        label = "No Go";
        tack = "";
    }
    else if (theta < 45 + 10) {
        label = "Close Hauled";
    }
    else if (theta < 90 - 10) {
        label = "Close Reach";
    }
    else if (theta < 90 + 10) {
        label = "Beam Reach";
    }
    else if (theta < 180 - 22.5) {
        label = "Broad Reach";
    }
    else {
        label = "Dead Run";
        tack = "";
    }

    const id = `${tack?tack.toLowerCase()+'-':""}${label.toLowerCase().replace(" ","-")}`;

    return { theta, id, tack, label };
}