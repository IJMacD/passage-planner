import { dateFormat } from "./dateFormat.js";
import { latlon2nm } from "./geo.js";

// AutomaticWeatherStation_en	GeometryLongitude	GeometryLatitude
/**
 * @type {[ name: string, lon: number, lat: number ][]}
 */
const automaticWeatherStations = [
    ["Central Pier", 114.1558333, 22.2888889],
    ["Chek Lap Kok", 113.9219444, 22.3094444],
    ["Cheung Chau", 114.0266667, 22.2011111],
    ["Cheung Chau Beach", 114.0291667, 22.2108333],
    ["Green Island", 114.1127778, 22.285],
    ["Hong Kong Sea School", 114.21429, 22.2183],
    ["Kai Tak", 114.2133333, 22.3097222],
    ["King's Park", 114.1727778, 22.3119444],
    ["Lamma Island", 114.1086111, 22.2261111],
    ["Lau Fau Shan", 113.9836111, 22.4688889],
    ["Ngong Ping", 113.9127778, 22.2586111],
    ["North Point", 114.199722, 22.294444],
    ["Peng Chau", 114.0433333, 22.2911111],
    ["Sai Kung", 114.2744444, 22.3755556],
    ["Sha Chau", 113.8911111, 22.3458333],
    ["Sha Tin", 114.21, 22.4025],
    ["Shek Kong", 114.0847222, 22.4361111],
    ["Stanley", 114.2186111, 22.2141667],
    ["Star Ferry", 114.16842, 22.293008],
    ["Ta Kwu Ling", 114.1566667, 22.5286111],
    ["Tai Mei Tuk", 114.2375, 22.4752778],
    ["Tai Po Kau", 114.1841667, 22.4425],
    ["Tap Mun", 114.3605556, 22.4713889],
    ["Tate's Cairn", 114.2177778, 22.3577778],
    ["Tseung Kwan O", 114.2555556, 22.3158333],
    ["Tsing Yi", 114.11, 22.3441667],
    ["Tuen Mun", 113.9641667, 22.3858333],
    ["Waglan Island", 114.3033333, 22.1822222],
    ["Wetland Park", 114.0088889, 22.4666667],
    ["Wong Chuk Hang", 114.1736111, 22.2477778],
];

/**
 * @param {number} lon
 * @param {number} lat
 */
export function findNearestAutomaticWeatherStation(lon, lat) {
    const distanceWeatherStations = automaticWeatherStations.map(s => {
        const distance = latlon2nm({ lon, lat }, { lon: s[1], lat: s[2] });
        return { name: s[0], distance };
    });

    distanceWeatherStations.sort((s1, s2) => s1.distance - s2.distance);

    return distanceWeatherStations[0].name;
}

/**
 * @param {Date} time
 * @param {string} station
 */
export async function getHistoricalWeatherAtStation(time, station) {
    const stations = await getHistoricalWeather(time);
    return stations.find(s => s.stationName === station) || null;
}

/**
 * @param {Date} time
 */
export async function getHistoricalWeather(time) {
    const timeString = dateFormat(time, "%Y%M%D-%h%m");
    const url = `https://api.data.gov.hk/v1/historical-archive/get-file?url=https%3A%2F%2Fdata.weather.gov.hk%2FweatherAPI%2Fhko_data%2Fregional-weather%2Flatest_10min_wind.csv&time=${timeString}`;

    const csv = await fetch(url).then(r => r.text());

    const lines = csv.split("\n");

    const [headers, ...data] = lines;

    const stations = data.map(line => {
        const fields = line.split(",");

        return {
            dateString: fields[0],
            stationName: fields[1],
            windDirection: compassDirectionToAngle(fields[2]),
            windSpeed: +fields[3],
            windGusts: +fields[4],
        }
    });

    return stations;
}

/**
 * @param {string} compassDirection
 * @returns {number}
 */
function compassDirectionToAngle(compassDirection) {
    return {
        North: 0,
        Northeast: 45,
        East: 90,
        Southeast: 135,
        South: 180,
        Southwest: 225,
        West: 270,
        Northwest: 315,
    }[compassDirection];
}