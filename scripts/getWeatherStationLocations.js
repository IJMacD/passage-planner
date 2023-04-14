import { ALL_STATIONS, getForecastURLByStation } from "../src/util/weather.js";

async function fetchAllLocations () {
    const out = [];

    for (const location of ALL_STATIONS) {
        const url = getForecastURLByStation(location);
        const data = await fetch(url).then(r => r.json());
        const { Latitude: lat, Longitude: lon } = data;
        out.push({ location, lat, lon });
    }

    console.log(JSON.stringify(out));
}

fetchAllLocations();