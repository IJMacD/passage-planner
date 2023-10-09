import { useContext, useMemo } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { useWeatherField } from "./useWeatherField.js";
import { findFieldForecast } from "../util/weather.js";
import { dateFormat } from "../util/dateFormat.js";

/**
 * @param {Date} time
 */
export function useWeatherFieldVectors(time) {
  const context = useContext(StaticMapContext);
  const weather = useWeatherField(context);

  const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
  const timeString = dateFormat(d, "%Y%M%D%h");

  /**
   * @type {import('../Layers/VectorFieldLayer.jsx').VectorFieldPoint[]}
  */
  const weatherFieldVector = useMemo(() => {
    const weatherForecastAtTime = findFieldForecast(weather, timeString);

    if (!weatherForecastAtTime) return [];

    return weatherForecastAtTime.filter(f => (f.forecast?.ForecastWindSpeed || 0) < 1000).map(weather => ({
      lon: weather.lon,
      lat: weather.lat,
      vector: [
        (weather.forecast?.ForecastWindSpeed || 0) * -Math.sin((weather.forecast?.ForecastWindDirection || 0) / 180 * Math.PI),
        (weather.forecast?.ForecastWindSpeed || 0) * Math.cos((weather.forecast?.ForecastWindDirection || 0) / 180 * Math.PI)
      ]
    }));
  }, [weather, timeString]);

  return weatherFieldVector;
}
