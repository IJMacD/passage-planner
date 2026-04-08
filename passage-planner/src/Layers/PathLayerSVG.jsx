import { useContext, useEffect, useRef } from "react";
import { DragContext } from "../Components/DragContext.js";
import { StaticMapContext } from "../Components/StaticMapContext.js";
import { renderPathLayer } from "../canvas-renderers/renderPathLayer.js";
import { lonLat2XY } from "../util/projection.js";

/**
 * @typedef {{points: {lon: number;lat: number;}[];color?: ?string;lineDash?: ?number[];}} Path
 */

/**
 *
 * @param {object} props
 * @param {Path[]} props.paths
 * @returns
 */
export function PathLayerSVG({ paths }) {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    const pxWidth = context.width * devicePixelRatio;
    const pxHeight = context.height * devicePixelRatio;


    const projection = lonLat2XY(context);

    return (
        <svg width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }}>
            {paths.map((path, i) => (
                <g key={i}>
                    <polyline
                        points={path.points.map(p => {
                            const [x, y] = projection(p.lon, p.lat);
                            return `${x},${y}`;
                        }).join(" ")}
                        fill="none"
                        stroke={path.color ?? "red"}
                        strokeWidth={2}
                        strokeDasharray={path.lineDash ? path.lineDash.join(",") : undefined}
                    />
                    {context.zoom >= 15 && path.points.map((p, j) => {
                        const [x, y] = projection(p.lon, p.lat);
                        const pointSize = context.zoom >= 18 ? 5 : 3;

                        return (
                            <circle key={j} cx={x} cy={y} r={pointSize} fill={path.color ?? "red"}>
                                <title>{`Lon: ${p.lon.toFixed(5)}, Lat: ${p.lat.toFixed(5)}\nTime: ${p.time ? p.time.toISOString() : "N/A"}`}</title>
                            </circle>
                        );
                    })}
                </g>
            ))}
        </svg>
    );
}
