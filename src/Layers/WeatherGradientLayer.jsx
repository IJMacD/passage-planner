import React from "react";
import { GradientFieldLayer } from "./GradientFieldLayer.jsx";
import { useWeatherFieldVectors } from "../hooks/useWeatherFieldVectors.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function WeatherGradientLayer({ time }) {
    const weatherFieldVector = useWeatherFieldVectors(time);

    return <GradientFieldLayer field={weatherFieldVector} alpha={128} rangeLimit={100} />
}
