import { useContext } from "react";
import { getVesselColours } from "../util/ais.js";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import React from "react";

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {import("../util/ais").Vessel[]} props.vessels
 * @returns
 */
export function AISLayerSVG ({ vessels }) {
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const tileWidth = TILE_SIZE * devicePixelRatio;
    const tileHeight = TILE_SIZE * devicePixelRatio;

    const tileCountX = pxWidth / tileWidth;
    const tileCountY = pxHeight / tileHeight;

    const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

    const minLon = tile2long(tileOffsetX, zoom);
    const minLat = tile2lat(tileOffsetY, zoom);
    const maxLon = tile2long(tileOffsetX + tileCountX, zoom);
    const maxLat = tile2lat(tileOffsetY + tileCountY, zoom);

    return (
        <svg viewBox={`0 0 ${pxWidth} ${pxHeight}`} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
        {
            vessels.map(vessel => {
                const lonFrac = (vessel.longitude-minLon)/(maxLon-minLon);
                const latFrac = (vessel.latitude-minLat)/(maxLat-minLat);

                if (lonFrac >= 0 && lonFrac <= 1 && latFrac >= 0 && latFrac <= 1) {
                    const x = lonFrac * pxWidth;
                    const y = latFrac * pxHeight;

                    const [ dark, light ] = getVesselColours(vessel);

                    if (vessel.speedOverGround === 0) {
                        return (
                            <ellipse key={vessel.mmsi} cx={x} cy={y} rx={10} ry={10} fill={light} stroke={dark} strokeWidth={2}>
                                <title>{vessel.name}</title>
                            </ellipse>
                        );
                    }

                    const s = 15;

                    return (
                        <path key={vessel.mmsi} d={`M 0 ${-2*s} L ${s} ${s} L 0 0 L ${-s} ${s} Z`} transform={`translate(${x}, ${y}) rotate(${vessel.courseOverGround + 180})`} fill={light} stroke={dark} strokeWidth={2} strokeLinejoin="round">
                            <title>{vessel.name}</title>
                        </path>
                    );
                }

                return null;
            })
        }
        </svg>
    );
}
