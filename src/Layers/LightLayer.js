import { useContext } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac, tile2lat, tile2long } from "../util/geo";
import { getBounds, lonLat2XY, StaticMapContext } from "../Components/StaticMap";
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
    const context = useContext(StaticMapContext);

    const lights = useLights(getBounds(context));

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            {
                lights.map((light, i) => {
                    if (!light) return null;

                    const [x, y] = lonLat2XY(light.lon, light.lat, context);

                    if (0 < 0 || x > context.width || y < 0 || y > context.height) {
                        return null;
                    }

                    return <LightFlasher key={light.id} spec={light.spec} x={x} y={y} />;
                })
            }
        </div>
    );
}
