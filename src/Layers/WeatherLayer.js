import React, { useContext, useMemo } from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import { useWeatherField } from "../hooks/useWeatherField.js";
import { findFieldForecast } from "../util/weather.js";
import { dateFormat } from "../util/dateFormat.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function WeatherLayer ({ time }) {
    const context = useContext(StaticMapContext);
    const weather = useWeatherField(context);

    const d = time.getMinutes() < 30 ? time : new Date(+time + 30 * 60 * 1000);
    const timeString = dateFormat(d, "%Y%M%D%h");

    const weatherForecast = useMemo(() => {
      return weather && findFieldForecast(weather, timeString);
    }, [weather, timeString]);

    /**
     * @type {import('../Layers/VectorFieldLayer.js').VectorFieldPoint[]}
     */
    const weatherFieldVector = useMemo(() => weatherForecast &&
      weatherForecast.map(weather => ({
        lon: weather.lon,
        lat: weather.lat,
        vector: [
            (weather.forecast?.ForecastWindSpeed||0) * -Math.sin((weather.forecast?.ForecastWindDirection||0)/180*Math.PI),
            (weather.forecast?.ForecastWindSpeed||0) * Math.cos((weather.forecast?.ForecastWindDirection||0)/180*Math.PI)
        ]
      })), [weatherForecast]);

    return weatherFieldVector && <ParticleFieldLayer field={weatherFieldVector} />
}
