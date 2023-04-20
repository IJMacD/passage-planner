import { useContext } from "react";
import { VesselShape, getVesselColours } from "../Components/VesselShapeByType.js";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import React from "react";
import { lonLat2XY } from "../util/projection.js";
import { useAnimation } from "../hooks/useAnimation.js";

/**
 *
 * @param {object} props
 * @param {import("../hooks/useWSAIS.js").VesselReport[]} props.vessels
 * @param {boolean} [props.showNames]
 * @param {boolean} [props.fade]
 * @param {boolean} [props.projectedTrack]
 * @param {boolean} [props.animation]
 * @returns
 */
export function AISLayerSVG ({ vessels, showNames = false, fade = false, projectedTrack = false, animation = false }) {
    const context = useContext(StaticMapContext);
    const { centre: [ , lat ], zoom, width, height } = context;

    useAnimation(animation);

    const projection = lonLat2XY(context);

    const now = Date.now();

    const [left,top] = useContext(DragContext);

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
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", position: "absolute", top, left }}>
        {
            vessels.map(vessel => {

                const [ x, y ] = projection(vessel.longitude, vessel.latitude);

                const s = 5;

                if (fade && typeof vessel.lastUpdate === "undefined") {
                    return null;
                }

                let opacity = 1;

                const delta = now - vessel.lastUpdate;

                if (fade) {
                    if (delta > 600_000) {
                        return null;
                    }

                    if (delta > 300_000) {
                        opacity = 0.5;
                    }
                }

                const animationFraction = animation ? Math.min(delta / 60000, 1) : 0;

                const [ stroke, fill ] = getVesselColours(vessel);

                return (
                    <g key={vessel.mmsi} transform={`translate(${x}, ${y})`} opacity={opacity}>
                        <title>{vessel.name}</title>
                        { projectedTrack && isMoving(vessel) && <path d={`M 0 0 V ${-vessel.speedOverGround * speedScalePerMinute}`} transform={`rotate(${vessel.courseOverGround})`} stroke="red" strokeWidth={1.5} />}
                        { isMoving(vessel) ?
                            <g transform={`rotate(${vessel.trueHeading||vessel.courseOverGround}) translate(0 ${-vessel.speedOverGround * speedScalePerMinute * animationFraction})`}>
                                <VesselShape vessel={vessel} size={s} />
                                { showNames && <text x={s*2} y={s*2} transform={`rotate(-${vessel.trueHeading||vessel.courseOverGround})`}>{vessel.name}</text> }
                            </g> :
                            <ellipse cx={0} cy={0} rx={s} ry={s} fill={fill} stroke={stroke} strokeWidth={2} />
                        }
                    </g>
                );
            })
        }
        </svg>
    );
}

/**
 * @param {import("../util/ais.js").Vessel} vessel
 */
function isMoving (vessel) {
    return typeof vessel.speedOverGround === "number" ?
        vessel.speedOverGround >= 1 : false;
}