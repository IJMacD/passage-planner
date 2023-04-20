import React from "react";
import { NavigationStatus } from "../util/ais.js";

/**
 * Vessel Colour by Navigation status
 * @param {import("../util/ais.js").Vessel} vessel
 * @returns {[ stroke: string, fill: string ]}
 */
export function getVesselColours (vessel) {
    switch (vessel.navigationStatus) {
        case NavigationStatus.UNDERWAY_USING_ENGINE:
            return [ "#080", "#8f8" ];
        case NavigationStatus.AT_ANCHOR:
            return [ "#080", "#fC8" ];
        case NavigationStatus.NOT_UNDER_COMMAND:
            return [ "#808", "#f8f" ];
        case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
            return [ "#F00", "#FCC" ];
        case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
            return [ "#848", "#fcf" ];
        case NavigationStatus.MOORED:
            return [ "#840", "#fC8" ];
        case NavigationStatus.AGROUND:
            return [ "#F00", "#fF4" ];
        case NavigationStatus.ENGAGED_IN_FISHING:
            return [ "#00F", "#4FF" ];
        case NavigationStatus.UNDERWAY_SAILING:
            return [ "#00f", "#88f" ];
        case NavigationStatus.RESERVED_HSC:
            return [ "#080", "#8f0" ];
        case NavigationStatus.NOT_DEFINED:
            return [ "#333", "#FFF" ];
        default:
            return [ "black", "white" ];
    }
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

    const type = typeof vessel.shipType === "number" ? vessel.shipType : 0;
    const type10 = Math.floor(type / 10) * 10;

    // Wing Craft
    // { type10 === 20 }
    // Towing
    if (type === 31) {

    }
    // Sailboat
    if (type === 36) {
        return <path d={`M 0 ${-2 * size} C ${size} ${-size} ${size * 0.8} 0 ${size * 0.8} ${size} L 0 ${size} L ${-size * 0.8} ${size} C ${-size * 0.8} 0 ${-size} ${-size} 0 ${-2 * size}`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }
    // High Speed Craft
    if (type10 === 40) {
        return <path d={`M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z M ${-size} ${size * 1.5} L 0 ${size} L ${size} ${size * 1.5} M ${-size} ${size * 2} L 0 ${size*1.5} L ${size} ${size * 2}`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }
    // Pilot
    if (type === 50) {

    }
    // Tug
    if (type === 52) {
        return <path d={`M ${-size} ${-size} A 1 1 0 0 1 ${size} ${-size} V ${size} H ${-size} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }
    // Passenger
    if (type10 === 60) {
        return <path d={`M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z M ${-size} ${size * 1.5} L 0 ${size} L ${size} ${size * 1.5}`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }
    // Cargo
    if (type10 === 70) {
        return <path d={`M 0 ${-2*size} L ${size} ${-size} V ${size} H ${-size} V ${-size} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }
    // Tanker
    if (type10 === 80) {
        return <path d={`M 0 ${-2*size} L ${size} ${-size} V ${size*2} H ${-size} V ${-size} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
    }

    return <path d={`M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />;
}
