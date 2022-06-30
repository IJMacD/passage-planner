
// ALL_STATIONS: ["CCH", "HKA", "HKO", "HKS", "JKB", "LFS", "PEN", "SEK", "SHA", "SKG", "TKL", "TPO", "TUN", "TY1", "WGL", "SSH" ]

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


export function getForecastURL (centre) {
    const loc = "PEN"; // Peng Chau
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
    return weather.HourlyWeatherForecast.find(f => f.ForecastHour === timeString);
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

    if (theta < 22.5) {
        label = "No Go";
        tack = "";
    }
    else if (theta < 45 + 22.5) {
        label = "Close Hauled";
    }
    else if (theta < 90 + 22.5) {
        label = "Beam Reach";
    }
    else if (theta < 180 - 12.25) {
        label = "Broad Reach";
    }
    else {
        label = "Dead Run";
        tack = "";
    }

    return { theta, tack, label };
}