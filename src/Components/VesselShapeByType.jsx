import React from "react";

/**
 *
 * @param {object} props
 * @param {import("../util/ais/ais.js").Vessel} [props.vessel]
 * @param {number} [props.size]
 * @param {"arrows"|"houses"} [props.vesselStyle]
 * @param {...any} [props.otherProps]
 * @returns
 */
export function VesselShape ({ vessel, size = 5, vesselStyle, ...otherProps }) {
    const d = vesselStyle === "arrows" ? getVesselShapeArrows(vessel, size) : getVesselShapeHouses(vessel, size);
    return <path d={d} {...otherProps} />
}

/**
 *
 * @param {import("../util/ais/ais.js").Vessel} [vessel]
 * @param {number} [size]
 * @returns
 */
function getVesselShapeArrows (vessel, size = 5) {
    const type = vessel && typeof vessel.shipType === "number" ? vessel.shipType : 0;
    const type10 = Math.floor(type / 10) * 10;

    // Wing Craft
    // { type10 === 20 }
    // Towing
    if (type === 31) {
        return `M 0 ${-2 * size} L ${size} ${size} L ${-size} ${size} Z M 0 ${size} A 1 1 0 0 0 0 ${size * 2} A 1 1 0 0 0 0 ${size}`;
    }
    // Sailboat
    if (type === 36) {
        return `M 0 ${-2 * size} C ${size} ${-size} ${size * 0.8} 0 ${size * 0.8} ${size} L 0 ${size} L ${-size * 0.8} ${size} C ${-size * 0.8} 0 ${-size} ${-size} 0 ${-2 * size}`;
    }
    // High Speed Craft
    if (type10 === 40) {
        return `M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z M ${-size} ${size * 1.5} L 0 ${size} M 0 ${size} L ${size} ${size * 1.5} M ${-size} ${size * 2} L 0 ${size*1.5} M 0 ${size*1.5} L ${size} ${size * 2}`;
    }
    // Pilot
    if (type === 50) {

    }
    // Tug
    if (type === 52) {
        return `M 0 ${-2 * size} L ${size} ${size} L ${-size} ${size} Z`;
        // return `M ${-size} ${-size} A 1 1 0 0 1 ${size} ${-size} V ${size} H ${-size} Z`;
    }
    // Passenger
    if (type10 === 60) {
        return `M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z M ${-size} ${size * 1.5} L 0 ${size} M 0 ${size} L ${size} ${size * 1.5}`;
    }
    // Cargo
    if (type10 === 70) {
        // return `M 0 ${-2*size} L ${size*0.666} ${-size} V ${size} H ${-size*0.666} V ${-size} Z`;
    }
    // Tanker
    if (type10 === 80) {
        // return `M 0 ${-2*size} L ${size*0.8} ${-size} V ${size*2} H ${-size*0.8} V ${-size} Z`;
    }

    return `M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z`;
}

/**
 *
 * @param {import("../util/ais/ais.js").Vessel} [vessel]
 * @param {number} [size]
 * @returns
 */
function getVesselShapeHouses (vessel, size = 5) {
    const type = vessel && typeof vessel.shipType === "number" ? vessel.shipType : 0;
    const type10 = Math.floor(type / 10) * 10;

    const lb = vessel && vessel.dimensionToBow && (vessel.dimensionToBow * 0.5) || size;
    const ls = vessel && vessel.dimensionToStern && (vessel.dimensionToStern * 0.5) || size;
    const wp = vessel && vessel.dimensionToPort && (vessel.dimensionToPort * 0.5) || (size * 0.5);
    const ws = vessel && vessel.dimensionToStarboard && (vessel.dimensionToStarboard * 0.5) || (size * 0.5);

    // Wing Craft
    // { type10 === 20 }
    // Towing
    if (type === 31) {
    }
    // Sailboat
    if (type === 36) {
    }
    // High Speed Craft
    if (type10 === 40) {
    }
    // Pilot
    if (type === 50) {

    }
    // Tug
    if (type === 52) {
        // return `M ${-size} ${-size} A 1 1 0 0 1 ${size} ${-size} V ${size} H ${-size} Z`;
    }
    // Passenger
    if (type10 === 60) {
        // return `M 0 ${-2*size} L ${size*0.8} ${-size} V ${size*2} H ${-size*0.8} V ${-size} Z`;
    }
    // Cargo
    if (type10 === 70) {
        // return `M 0 ${-2*size} L ${size*0.666} ${-size} V ${size} H ${-size*0.666} V ${-size} Z`;
    }
    // Tanker
    if (type10 === 80) {
        // return `M 0 ${-2*size} L ${size*0.8} ${-size} V ${size*2} H ${-size*0.8} V ${-size} Z`;
    }

    // return `M 0 ${-2*l} L ${w*0.8} ${-l} V ${l*2} H ${-w*0.8} V ${-l} Z`;

    //       ^
    //   +       +
    //   |  *    |
    //   |       |
    //   +-------+
    //
    //

    const t = (ws+wp)/2;

    return `M ${ws-t} ${-lb} L ${ws} ${-lb+t} V ${ls} H ${-wp} V ${-lb+t} Z`;
}
