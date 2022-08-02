import React, { useContext } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac } from "../util/geo";
import { lonLat2XY, StaticMapContext } from "../Components/StaticMap";
import { Marker } from "../Components/Marker";

const TILE_SIZE = 256;

/**
 * @typedef Marker
 * @prop {number} lon
 * @prop {number} lat
 * @prop {string} name
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

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            {
                markers.map((marker, i) => {
                    if (!marker) return null;

                    const [ x, y ] = lonLat2XY(marker.lon, marker.lat, context);

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

                    return <Marker key={i} name={marker.name??"green"} x={x} y={y} rotation={marker.rotation} onClick={handleClick} />;
                })
            }
        </div>
    );
}
