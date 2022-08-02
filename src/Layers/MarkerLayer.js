import React, { useContext } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";
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
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const tileCountX = width / TILE_SIZE;
    const tileCountY = height / TILE_SIZE;

    const minTileX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const minTileY = lat2tile(centre[1], zoom) - tileCountY / 2;
    const maxTileX = minTileX + tileCountX;
    const maxTileY = minTileY + tileCountY;

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            {
                markers.map((marker, i) => {
                    if (!marker) return null;

                    const tileX = lon2tileFrac(marker.lon, zoom);
                    const tileY = lat2tileFrac(marker.lat, zoom);

                    if (tileX < minTileX || tileX > maxTileX || tileY < minTileY || tileY > maxTileY) {
                        return null;
                    }

                    const x = (tileX - minTileX) / tileCountX * width;
                    const y  = (tileY - minTileY) / tileCountY * height;

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
