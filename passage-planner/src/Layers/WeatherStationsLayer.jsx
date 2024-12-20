import { useContext, useMemo } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { useWeatherField } from "../hooks/useWeatherField.js";
import { findFieldForecast } from "../util/weather.js";
import { dateFormat } from "../util/dateFormat.js";
import { VectorFieldLayer } from "./VectorFieldLayer.jsx";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function WeatherStationsLayer({ time }) {
  const context = useContext(StaticMapContext);
  const weather = useWeatherField(context);

  const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
  const timeString = dateFormat(d, "%Y%M%D%h");

  const weatherForecast = useMemo(() => {
    return weather && findFieldForecast(weather, timeString);
  }, [weather, timeString]);

  // const weatherMarkers = ALL_STATION_LOCATIONS.map(s => weather.find());
  /** @type {import('./VectorFieldLayer.jsx').Field} */
  const weatherMarkers = weatherForecast.filter(f => (f.forecast?.ForecastWindSpeed || 0) < 1000).map(f => ({
    lat: f.lat,
    lon: f.lon,
    direction: ((f.forecast?.ForecastWindDirection || 0) + 180) % 360,
    magnitude: (f.forecast?.ForecastWindSpeed || 0) > 1000 ? 0 : (f.forecast?.ForecastWindSpeed || 0),
  }));

  return weatherMarkers && <VectorFieldLayer field={weatherMarkers} scale={0.5} />;
}
