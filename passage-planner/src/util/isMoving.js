/**
 * @param {import("./ais/ais.js").Vessel} vessel
 */
export function isMoving(vessel) {
    return typeof vessel.speedOverGround === "number" ?
        vessel.speedOverGround >= 1 : false;
}
