import { useContext } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac, tile2lat, tile2long } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";
import React from "react";
import { LightFlasher } from "../Components/LightFlasher";
import { useLights } from "../hooks/useLights";

const TILE_SIZE = 256;

/**
 * @typedef Light
 * @prop {number} lon
 * @prop {number} lat
 * @prop {string} spec
 * @prop {string} [name]
 */

/**
 *
 * @returns
 */
export function LightLayer () {
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const tileCountX = width / TILE_SIZE;
    const tileCountY = height / TILE_SIZE;

    const minTileX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const minTileY = lat2tile(centre[1], zoom) - tileCountY / 2;
    const maxTileX = minTileX + tileCountX;
    const maxTileY = minTileY + tileCountY;

    const minLon = tile2long(minTileX, zoom);
    const maxLat = tile2lat(minTileY, zoom);
    const maxLon = tile2long(maxTileX + 1, zoom);
    const minLat = tile2lat(maxTileY +1, zoom);

    const lights = useLights([minLon,minLat,maxLon,maxLat]);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            {
                lights.map((light, i) => {
                    if (!light) return null;

                    const tileX = lon2tileFrac(light.lon, zoom);
                    const tileY = lat2tileFrac(light.lat, zoom);

                    if (tileX < minTileX || tileX > maxTileX || tileY < minTileY || tileY > maxTileY) {
                        return null;
                    }

                    const x = (tileX - minTileX) / tileCountX * width;
                    const y  = (tileY - minTileY) / tileCountY * height;

                    return <LightFlasher key={i} spec={light.spec} x={x} y={y} />;
                })
            }
        </div>
    );
}
