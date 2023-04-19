import React, { useContext } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import { lonLat2XY } from "../util/projection.js";
import { Marker } from "../Components/Marker.js";

/**
 * @typedef Marker
 * @prop {number} lon
 * @prop {number} lat
 * @prop {string} [name]
 * @prop {number} [rotation]
 */

/**
 *
 * @param {object} props
 * @param {Marker[]} props.markers
 * @param {((index: number) => void)?} [props.onClick]
 * @returns
 */
export function MarkerLayer ({ markers, onClick = null }) {
    const context = useContext(StaticMapContext);
    const projection = lonLat2XY(context);

    const [left,top] = useContext(DragContext);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top, left, lineHeight: 0, }}>
            {
                markers.map((marker, i) => {
                    if (!marker) return null;

                    const [ x, y ] = projection(marker.lon, marker.lat);

                    if (x < 0 || x > context.width || y < 0 || y > context.height) {
                        return null;
                    }

                    /**
                     * @param {import("react").MouseEvent} e
                     */
                    function handleClick (e) {
                        if (onClick) {
                            e.stopPropagation();
                            onClick(i);
                        }
                    }

                    return <Marker key={i} name={marker.name??"red-dot"} x={x} y={y} rotation={marker.rotation} onClick={handleClick} />;
                })
            }
        </div>
    );
}
