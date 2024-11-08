import { dateFormat } from "./dateFormat.js";
import { latlon2nm } from "./geo.js";

export const ALL_STATIONS = ["CCH", "HKA", "HKO", "HKS", "JKB", "LFS", "PEN", "SEK", "SHA", "SKG", "TKL", "TPO", "TUN", "TY1", "WGL", "SSH"];
// ALL STATIONS: ['CCH', 'HKA', 'HKO', 'HKS', 'JKB', 'LFS', 'PEN', 'SEK', 'SHA', 'SKG', 'TKL', 'TPO', 'TUN', 'TY1', 'WGL', 'SSH', 'DF3647', 'GF3640', 'ARWF_MKA', 'ARWF_SFY', 'ARWF_TWS', 'ARWF_TIT', 'ARWF_CCC', 'ARWF_CYS']

// Updated by /scripts/getWeatherStationLocations.js
export const ALL_STATION_LOCATIONS = [{ loc: "CCH", lat: 22.201, lon: 114.027 }, { loc: "HKA", lat: 22.309, lon: 113.922 }, { loc: "HKO", lat: 22.302, lon: 114.174 }, { loc: "HKS", lat: 22.245, lon: 114.174 }, { loc: "JKB", lat: 22.316, lon: 114.256 }, { loc: "LFS", lat: 22.469, lon: 113.984 }, { loc: "PEN", lat: 22.291, lon: 114.043 }, { loc: "SEK", lat: 22.436, lon: 114.085 }, { loc: "SHA", lat: 22.403, lon: 114.21 }, { loc: "SKG", lat: 22.376, lon: 114.274 }, { loc: "TKL", lat: 22.529, lon: 114.157 }, { loc: "TPO", lat: 22.4482, lon: 114.177 }, { loc: "TUN", lat: 22.386, lon: 113.964 }, { loc: "TY1", lat: 22.3443, lon: 114.11 }, { loc: "WGL", lat: 22.182, lon: 114.303 }, { loc: "SSH", lat: 22.502, lon: 114.111 }]

// Tide Gauge Info
export const ALL_TIDE_STATIONS_INFO = {
    CLK: { latlon: [113.945277, 22.319999], name: "Chek Lap Kok (E)", nameUC: "赤鱲角(東)", nameGB: "赤\u9c72角(东)", dept: "AT", maintain: "N", startYear: 2000, stationPhotos: "N" },
    // CLW: { latlon: [113.897000,22.304000], name: "Chek Lap Kok (W)",  nameUC: "赤鱲角(西)", nameGB: "赤\u9c72角(西)", dept: "A", maintain: "N", startYear:2000, stationPhotos:"N" },
    CCH: { latlon: [114.023055, 22.214444], name: "Cheung Chau", nameUC: "長洲", nameGB: "长洲", dept: "M", maintain: "N", startYear: 2005, stationPhotos: "Y" },
    KLW: { latlon: [114.360833, 22.458611], name: "Ko Lau Wan", nameUC: "高流灣", nameGB: "高流湾", dept: "M", maintain: "N", startYear: 1999, stationPhotos: "Y" },
    KCT: { latlon: [114.122222, 22.323611], name: "Kwai Chung", nameUC: "葵涌", nameGB: "葵涌", dept: "M", maintain: "N", startYear: 2001, stationPhotos: "Y" },
    MWC: { latlon: [114.071388, 22.363888], name: "Ma Wan", nameUC: "馬灣", nameGB: "马湾", dept: "M", maintain: "N", startYear: 2004, stationPhotos: "Y" },
    QUB: { latlon: [114.213333, 22.291111], name: "Quarry Bay", nameUC: "鰂魚涌", nameGB: "鲗鱼涌", dept: "H", maintain: "N", startYear: 1954, stationPhotos: "Y" },
    SPW: { latlon: [113.894444, 22.220278], name: "Shek Pik", nameUC: "石壁", nameGB: "石壁", dept: "H", maintain: "N", startYear: 1997, stationPhotos: "Y" },
    TMW: { latlon: [114.288611, 22.269722], name: "Tai Miu Wan", nameUC: "大廟灣", nameGB: "大庙湾", dept: "H", maintain: "N", startYear: 1996, stationPhotos: "Y" },
    TPK: { latlon: [114.183889, 22.442499], name: "Tai Po Kau", nameUC: "大埔滘", nameGB: "大埔\u6ed8", dept: "H", maintain: "N", startYear: 1962, stationPhotos: "Y" },
    TBT: { latlon: [114.013055, 22.487222], name: "Tsim Bei Tsui", nameUC: "尖鼻咀", nameGB: "尖鼻咀", dept: "H", maintain: "N", startYear: 1974, stationPhotos: "Y" },
    // SKT: { latlon: [114.353000,22.348000], name: "Sha Kiu Tau",   nameUC: "沙橋頭", nameGB: "沙桥头", 	 dept: "M", maintain: "N", startYear:2019, stationPhotos:"Y" },
    WAG: { latlon: [114.302777, 22.183333], name: "Waglan Island", nameUC: "橫瀾島", nameGB: "横澜岛", dept: "H", maintain: "N", startYear: 1976, stationPhotos: "Y" },
    TAO: { latlon: [113.863778, 22.253500], name: "Tai O", nameUC: "大澳", nameGB: "大澳", dept: "D", maintain: "N", align: "E", startYear: 2005, stationPhotos: "Y" }
};

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
 * @prop {number} ForecastTemperature °c
 * @prop {number} ForecastRelativeHumidity %
 * @prop {number} ForecastWindSpeed km/h
 * @prop {number} ForecastWindDirection °
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
export function getForecastURL(centre) {
    return getForecastURLs(centre)[0];
}

/**
 * @param {[ longitude: number, latitude: number ]} centre
 */
export function getForecastURLs(centre, count = 1) {

    return getNearestStations(centre, count).map(s => getForecastURLByStation(s.loc));
}

/**
 * @param {[ longitude: number, latitude: number ]} centre
 */
export function getNearestStations(centre, count = 1) {
    const allStations = ALL_STATION_LOCATIONS.map(station => {
        const distance = latlon2nm({ lon: centre[0], lat: centre[1] }, station);
        return { ...station, distance };
    });

    allStations.sort((a, b) => a.distance - b.distance);

    return allStations.slice(0, count);
}

/**
 * @param {string} loc
 */
export function getForecastURLByStation(loc) {
    return `/weather_forecast.php?location=${loc}`;
}

/**
 * Find the closest hourly forecast
 * @param {WeatherResponse} weather
 * @param {Date} time
 */
export function findForecast(weather, time) {
    const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
    const timeString = dateFormat(d, "%Y%M%D%h");
    return weather.HourlyWeatherForecast.find(f => f.ForecastHour === timeString) || null;
}

/**
 * Find the closest hourly forecast
 * @param {{ lon: number, lat: number, weather: WeatherResponse }[]} weather
 * @param {string} timeString Forecasts are hourly so timeString looks like "2023100316"
 */
export function findFieldForecast(weather, timeString) {
    return weather.map(field => {
        const { weather, ...rest } = field;
        const forecast = weather.HourlyWeatherForecast.find(f => f.ForecastHour === timeString) || null;
        return { ...rest, forecast };
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

    const id = `${tack ? tack.toLowerCase() + '-' : ""}${label.toLowerCase().replace(" ", "-")}`;

    return { theta, id, tack, label };
}
