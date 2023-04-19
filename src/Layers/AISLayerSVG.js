import { useContext } from "react";
import { getVesselColours } from "../util/ais.js";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import React from "react";
import { lonLat2XY } from "../util/projection.js";

/**
 *
 * @param {object} props
 * @param {import("../hooks/useWSAIS.js").VesselReport[]} props.vessels
 * @param {boolean} [props.showNames]
 * @param {boolean} [props.fade]
 * @param {boolean} [props.projectedTrack]
 * @returns
 */
export function AISLayerSVG ({ vessels, showNames = false, fade = false, projectedTrack = false }) {
    const context = useContext(StaticMapContext);
    const { width, height } = context;

    const projection = lonLat2XY(context);

    const now = Date.now();

    const [left,top] = useContext(DragContext);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", position: "absolute", top, left }}>
        {
            vessels.map(vessel => {

                    const [ x, y ] = projection(vessel.longitude, vessel.latitude);

                    const [ dark, light ] = getVesselColours(vessel);

                    const s = 5;

                    if (fade && typeof vessel.lastUpdate === "undefined") {
                        return null;
                    }

                    let opacity = 1;

                    if (fade) {
                        const delta = now - vessel.lastUpdate;

                        if (delta > 600_000) {
                            return null;
                        }

                        if (delta > 300_000) {
                            opacity = 0.5;
                        }
                    }

                    const type = typeof vessel.shipType === "number" ? vessel.shipType : 0;
                    const type10 = Math.floor(type / 10) * 10;

                    return (
                        <g key={vessel.mmsi} transform={`translate(${x}, ${y})`} opacity={opacity}>
                            <title>{vessel.name}</title>
                            { projectedTrack && isMoving(vessel) && <path d={`M 0 0 V ${-vessel.speedOverGround * 5}`} transform={`rotate(${vessel.courseOverGround})`} stroke="red" strokeWidth={1.5} />}
                            { isMoving(vessel) ?
                                <g transform={`rotate(${vessel.trueHeading||vessel.courseOverGround})`}>
                                    <path d={`M 0 ${-2*s} L ${s} ${s} L 0 ${s/2} L ${-s} ${s} Z`} fill={light} stroke={dark} strokeWidth={2} strokeLinejoin="round" />
                                    { /* Wing Craft */ }
                                    { type10 === 20 && <path d={`M 0 ${s} L ${s} ${2*s} H ${-s} Z`} fill={dark} /> }
                                    { /* Towing */ }
                                    { type === 31 && <path d={`M 0 ${-4*s} V ${-2*s} M ${-s} ${-3*s} H ${s}`} stroke={dark} strokeWidth={2} /> }
                                    { /* Sailboat */ }
                                    { type === 36 && <path d={`M 0 ${-3*s} A 1 1 0 0 1 0 ${-2*s}`} fill={dark} /> }
                                    { /* High Speed Craft */ }
                                    { type10 === 40 && <path d={`M 0 ${-3*s} L ${s} ${-2*s} H ${-s} Z`} fill={dark} /> }
                                    { /* Pilot */ }
                                    { type === 50 && <path d={`M 0 ${-2*s} V ${-4*s} A 1 1 0 0 1 0 ${-3*s}`} stroke={dark} fill="none" /> }
                                    { /* Tug */ }
                                    { type === 52 && <path d={`M 0 ${-3*s} V ${-2*s} M ${-s} ${-2*s} H ${s}`} stroke={dark} strokeWidth={2} /> }
                                    { /* Passenger */ }
                                    { type10 === 60 && <ellipse cx={0} cy={-2.5*s} rx={s/2} ry={s/2} fill={dark} /> }
                                    { /* Cargo */ }
                                    { type10 === 70 && <rect x={-s/2} y={-3*s} width={s} height={s} fill={dark} /> }
                                    { /* Tanker */ }
                                    { type10 === 80 && <rect x={-s/2} y={-4*s} width={s} height={s*2} fill={dark} /> }


                                    { type10 === 99 && <ellipse cx={0} cy={-2.5*s} r={s/2} stroke={dark} /> }
                                </g> :
                                <ellipse cx={0} cy={0} rx={s} ry={s} fill={light} stroke={dark} strokeWidth={2} />
                            }
                            { showNames && <text x={s*2} y={s*2}>{vessel.name}</text> }
                        </g>
                    );
            })
        }
        </svg>
    );
}
function isMoving (vessel) {
    return vessel.speedOverGround >= 1;
}

