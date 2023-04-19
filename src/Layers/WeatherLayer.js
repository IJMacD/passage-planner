import React, { useContext } from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import { useWeatherField } from "../hooks/useWeatherField.js";
import { findFieldForecast } from "../util/weather.js";

export function WeatherLayer ({ time }) {
    const context = useContext(StaticMapContext);
    const weather = useWeatherField(context);

    const weatherForecast = weather && findFieldForecast(weather, time);
    /**
     * @type {import('../Layers/VectorFieldLayer.js').VectorFieldPoint[]}
     */
    const weatherFieldVector = weatherForecast &&
      weatherForecast.map(weather => ({
        lon: weather.lon,
        lat: weather.lat,
        vector: [
            weather.forecast?.ForecastWindSpeed * -Math.sin(weather.forecast?.ForecastWindDirection/180*Math.PI),
            weather.forecast?.ForecastWindSpeed * Math.cos(weather.forecast?.ForecastWindDirection/180*Math.PI)
        ]
      }));

    return weatherFieldVector && <ParticleFieldLayer field={weatherFieldVector} />
}