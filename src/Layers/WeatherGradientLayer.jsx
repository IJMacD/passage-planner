import React, { useContext, useMemo } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { useWeatherField } from "../hooks/useWeatherField.js";
import { findFieldForecast } from "../util/weather.js";
import { dateFormat } from "../util/dateFormat.js";
import { GradientFieldLayer } from "./GradientFieldLayer.jsx";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function WeatherGradientLayer ({ time }) {
    const context = useContext(StaticMapContext);
    const weather = useWeatherField(context);

    const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
    const timeString = dateFormat(d, "%Y%M%D%h");

    const weatherForecast = useMemo(() => {
      return weather && findFieldForecast(weather, timeString);
    }, [weather, timeString]);

    /**
     * @type {import('./VectorFieldLayer.jsx').VectorFieldPoint[]}
     */
    const weatherFieldVector = useMemo(() => weatherForecast &&
      weatherForecast.filter(f => (f.forecast?.ForecastWindSpeed||0)<1000).map(weather => ({
        lon: weather.lon,
        lat: weather.lat,
        vector: [
            (weather.forecast?.ForecastWindSpeed||0) * -Math.sin((weather.forecast?.ForecastWindDirection||0)/180*Math.PI),
            (weather.forecast?.ForecastWindSpeed||0) * Math.cos((weather.forecast?.ForecastWindDirection||0)/180*Math.PI)
        ]
      })), [weatherForecast]);

    return weatherFieldVector && <GradientFieldLayer field={weatherFieldVector} alpha={128} rangeLimit={Infinity} />
}
