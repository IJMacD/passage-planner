import { getPointOfSail } from "../util/weather";

/**
 *
 * @param {object} props
 * @param {number} props.heading
 * @param {number} props.windDirection Degrees to source of wind. i.e. A southerly wind (180 deg) blows to the North.
 * @returns
 */
export function PointOfSail({ heading, windDirection }) {
    const { theta, tack, label } = getPointOfSail(heading, windDirection);

    return <span>{tack} {label}</span>;
}


