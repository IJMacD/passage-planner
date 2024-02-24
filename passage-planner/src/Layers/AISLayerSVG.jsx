import React from "react";
import { useContext } from "react";
import { VesselShape } from "../Components/VesselShapeByType.jsx";
import { getVesselColours } from "../Components/getVesselColours.jsx";
import { DragContext, StaticMapContext } from "../Components/StaticMapContext.js";
import { lonLat2XY } from "../util/projection.js";
import { useAnimation } from "../hooks/useAnimation.js";
import { isMoving } from "../util/isMoving.js";

/**
 *
 * @param {object} props
 * @param {import("../hooks/useWebsocketVessels.js").VesselReport[]} props.vessels
 * @param {boolean} [props.showNames]
 * @param {boolean} [props.fade]
 * @param {boolean} [props.projectTrack]
 * @param {boolean} [props.animate]
 * @param {"arrows"|"houses"} [props.vesselStyle]
 * @returns
 */
export function AISLayerSVG({
    vessels,
    showNames = false,
    fade = false,
    projectTrack = false,
    animate = false,
    vesselStyle = "arrows",
}) {
    const context = useContext(StaticMapContext);
    const { centre: [, lat], zoom, width, height } = context;

    useAnimation(animate);

    const projection = lonLat2XY(context);

    const now = Date.now();

    const [left, top] = useContext(DragContext);

    const worldWidthInTiles = Math.pow(2, zoom);
    const worldRadiusInMetres = 6_372_798.2;
    const worldCircumferenceInMetres = worldRadiusInMetres * Math.PI * 2;
    const latitudeCircumference = Math.cos(lat / 180 * Math.PI) * worldCircumferenceInMetres;
    const metresPerTile = latitudeCircumference / worldWidthInTiles;
    const metresPerPixel = metresPerTile / 256;
    const pixelsPerNauticalMile = 1852 / metresPerPixel;

    // nm_per_hour * pixels_per_nm * hours_per_minute = pixels_per_minute
    //
    // units: pixel_hours_per_nm_minute
    const speedScalePerMinute = pixelsPerNauticalMile / 60;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", position: "absolute", top, left, userSelect: "none" }}>
            {
                vessels.map(vessel => {
                    if (typeof vessel.longitude === "undefined" || typeof vessel.latitude === "undefined") {
                        return null;
                    }

                    const [x, y] = projection(vessel.longitude, vessel.latitude);

                    const s = 5;

                    if (fade && typeof vessel.lastUpdate === "undefined") {
                        return null;
                    }

                    let opacity = 1;

                    const delta = now - vessel.lastUpdate;

                    if (fade) {
                        const TEN_MINUTES = 600_000;
                        const FIVE_MINUTES = 300_000;
                        const TWO_MINUTES = 120_000;

                        if (delta > TEN_MINUTES) {
                            return null;
                        }

                        if (isMoving(vessel)) {
                            if (delta > TWO_MINUTES) {
                                opacity = 0.5;
                            }
                        }
                        else {
                            if (delta > FIVE_MINUTES) {
                                opacity = 0.5;
                            }
                        }
                    }

                    const animationFraction = animate ? Math.min(delta / 60000, 1) : 0;

                    const [stroke, fill] = getVesselColours(vessel);

                    const strokeDash = isMoving(vessel) ? void 0 : "2 2";

                    const strokeWidth = 1;
                    // const strokeWidth = isMoving(vessel) ? 2 : 1;

                    const speedOverGround = typeof vessel.speedOverGround === "number" ? vessel.speedOverGround : 0;

                    let courseOverGround = typeof vessel.courseOverGround === "number" ? vessel.courseOverGround : 0;

                    const headingDelta = typeof vessel.trueHeading === "number" ? vessel.trueHeading - courseOverGround : 0;

                    let predictedPath = `M 0 0 V ${-speedOverGround * speedScalePerMinute}`;
                    let dx = 0;
                    let dy = -speedOverGround * speedScalePerMinute * animationFraction;

                    if (typeof vessel.rateOfTurn === "number" && vessel.rateOfTurn !== 0) {
                        // courseOverGround += vessel.rateOfTurn * animationFraction;

                        let _x = 0;
                        let _y = 0;
                        const delta = 0.1
                        const r = delta * -speedOverGround * speedScalePerMinute;

                        const path = [`M 0 0`];

                        for (let i = 0; i < 1; i += delta) {
                            const course = i * vessel.rateOfTurn;
                            const theta = course / 180 * Math.PI;
                            _x += r * -Math.sin(theta);
                            _y += r * Math.cos(theta);
                            path.push(`L ${_x.toFixed(3)} ${_y.toFixed(3)}`);

                            if (i < animationFraction) {
                                dx = _x;
                                dy = _y;
                            }
                        }

                        predictedPath = path.join(" ");
                    }

                    return (
                        <g key={vessel.mmsi} transform={`translate(${x}, ${y})`} opacity={opacity}>
                            <title>{vessel.name || vessel.mmsi}</title>
                            {projectTrack && isMoving(vessel) && <path d={predictedPath} transform={`rotate(${courseOverGround})`} stroke="red" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />}
                            <g transform={`rotate(${courseOverGround}) translate(${dx} ${dy})`}>
                                <VesselShape vessel={vessel} vesselStyle={vesselStyle} transform={`rotate(${headingDelta})`} stroke={stroke} fill={fill} strokeWidth={strokeWidth} strokeDasharray={strokeDash} strokeLinecap="round" strokeLinejoin="round" />
                                {showNames &&
                                    <>
                                        <text x={s * 2} y={s * 2} transform={`rotate(-${courseOverGround})`} stroke="white" fontSize="0.6em" fontWeight="bold">{vessel.name}</text>
                                        <text x={s * 2} y={s * 2} transform={`rotate(-${courseOverGround})`} fontSize="0.6em" fontWeight="bold">{vessel.name}</text>
                                    </>
                                }
                            </g>
                        </g>
                    );
                })
            }
        </svg>
    );
}

