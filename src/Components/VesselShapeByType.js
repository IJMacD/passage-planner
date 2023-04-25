import { NavigationStatus } from "../util/ais/ais.js";

/**
 * Vessel Colour by Navigation status
 * @param {import("../util/ais/ais.js").Vessel} vessel
 * @returns {[ stroke: string, fill: string ]}
 */
export function getVesselColours (vessel) {
    switch (vessel.navigationStatus) {
        case NavigationStatus.UNDERWAY_USING_ENGINE:
            return [ "#080", "#8f8" ];
        case NavigationStatus.AT_ANCHOR:
            return [ "#F00", "#DA6" ];
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
            return [ "#333", "white" ];
        default:
            return [ "black", "#333" ];
    }
}


/**
 *
 * @param {object} props
 * @param {import("../util/ais/ais.js").Vessel} props.vessel
 * @param {number} props.size
 * @returns
 */
export function getVesselShape(vessel, size) {

    const type = typeof vessel.shipType === "number" ? vessel.shipType : 0;
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
        return `M 0 ${-2*size} L ${size*0.666} ${-size} V ${size} H ${-size*0.666} V ${-size} Z`;
    }
    // Tanker
    if (type10 === 80) {
        return `M 0 ${-2*size} L ${size*0.8} ${-size} V ${size*2} H ${-size*0.8} V ${-size} Z`;
    }

    return `M 0 ${-2 * size} L ${size} ${size} L 0 ${size / 2} L ${-size} ${size} Z`;
}
