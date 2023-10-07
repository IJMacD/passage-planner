import React from "react";
import { NavigationStatus } from "../util/ais.js";

/**
 * @param {import("../util/ais.js").Vessel} vessel
 * @returns {[ stroke: string, fill: string ]}
 */

export function getVesselColours(vessel) {

    const type = typeof vessel.shipType === "number" ? vessel.shipType : 0;
    const type10 = Math.floor(type / 10) * 10;

    // Wing Craft
    // { type10 === 20 }
    // Towing
    if (type === 31) {
        return ["black", "yellow"];
    }
    // Sailboat
    if (type === 36) {
        return ["#00f", "#88f"];
    }
    // High Speed Craft
    if (type10 === 40) {
        return ["#080", "#F80"];
    }
    // Pilot
    if (type === 50) {
        return ["red", "white"];
    }
    // Tug
    if (type === 52) {
        return ["black", "grey"];
    }
    // Passenger
    if (type10 === 60) {
        return ["#080", "#8f8"];
    }
    // Cargo
    if (type10 === 70) {
        return ["#080", "#fC8"];
    }
    // Tanker
    if (type10 === 80) {
        return ["#840", "#fC8"];
    }

    // Orange/Yellow
    // return [ "#F80", "#FF0" ];
    return ["black", "white"];
}
/**
 *
 * @param {object} props
 * @param {import("../util/ais.js").Vessel} props.vessel
 * @param {number} props.size
 * @returns
 */
export function VesselShape({ vessel, size }) {
    const [stroke, fill] = getVesselColours(vessel);

    if (vessel.navigationStatus === NavigationStatus.MOORED) {
        return <ellipse cx={0} cy={0} rx={size} ry={size} fill={fill} stroke={stroke} strokeWidth={2} />;
    }

    if (vessel.navigationStatus === NavigationStatus.AT_ANCHOR) {
        return <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={fill} stroke={stroke} strokeWidth={2} />;
    }

    if (vessel.navigationStatus === NavigationStatus.NOT_UNDER_COMMAND) {
        return <path d={`M 0 ${-size} L ${size / 2} 0 H ${-size / 2} Z`} fill={fill} stroke={stroke} strokeWidth={2} />;
    }

    if (vessel.navigationStatus === NavigationStatus.UNDERWAY_USING_ENGINE) {
        return <path d={`M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }

    if (vessel.navigationStatus === NavigationStatus.UNDERWAY_SAILING) {
        return <path d={`M 0 ${-2 * size} C ${size} ${-size} ${size * 0.8} 0 ${size * 0.8} ${size} L 0 ${size} L ${-size * 0.8} ${size} C ${-size * 0.8} 0 ${-size} ${-size} 0 ${-2 * size}`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }

    if (vessel.navigationStatus === NavigationStatus.RESERVED_HSC) {
        return <path d={`M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z M ${-size} ${size * 1.5} L 0 ${size} L ${size} ${size * 1.5}`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }

    return (
        <ellipse cx={0} cy={0} rx={size / 2} ry={size / 2} fill={stroke} stroke={stroke} strokeWidth={2}>
            <title>{vessel.navigationStatus}</title>
        </ellipse>
    );
}
