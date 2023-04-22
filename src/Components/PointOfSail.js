import React from "react";
import { getPointOfSail } from "../util/weather.js";

/**
 *
 * @param {object} props
 * @param {number} props.heading
 * @param {number} props.windDirection Degrees to source of wind. i.e. A southerly wind (180 deg) blows to the North.
 * @returns
 */
export function PointOfSail({ heading, windDirection }) {
    const { tack, label } = getPointOfSail(heading, windDirection);

    return <span>{tack} {label}</span>;
}


