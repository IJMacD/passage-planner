
import { useWeatherFieldVectors } from "../hooks/useWeatherFieldVectors.js";
import { BarbFieldLayer } from "./BarbFieldLayer.jsx";

/**
 * @typedef WeatherBarbLayerProps
 * @property {Date} time
 */

/**
 *
 * @param {WeatherBarbLayerProps & { [key: string]: any }} props
 * @returns
 */
export function WeatherBarbLayer({ time, ...otherProps }) {
  const weatherFieldVectors = useWeatherFieldVectors(time);

  return <BarbFieldLayer field={weatherFieldVectors} {...otherProps} />
}
