import React from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.jsx";
import { useWeatherFieldVectors } from "../hooks/useWeatherFieldVectors.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function WeatherParticleLayer({ time }) {
  const weatherFieldVectors = useWeatherFieldVectors(time);

  return <ParticleFieldLayer field={weatherFieldVectors} particleFill="#CCC" />
}
