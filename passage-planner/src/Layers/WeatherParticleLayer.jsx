import { ParticleFieldLayer } from "./ParticleFieldLayer.jsx";
import { useWeatherFieldVectors } from "../hooks/useWeatherFieldVectors.js";

/**
 * @typedef WeatherParticleLayerProps
 * @property {Date} time
 */

/**
 *
 * @param {WeatherParticleLayerProps & { [key: string]: any }} props
 * @returns
 */
export function WeatherParticleLayer({ time, ...otherProps }) {
  const weatherFieldVectors = useWeatherFieldVectors(time);

  return <ParticleFieldLayer field={weatherFieldVectors} {...otherProps} />
}
