import { useContext } from "react";
import React from "react";
import { LightFlasher } from "../Components/LightFlasher.jsx";
import { useLights } from "../hooks/useLights.js";
import { DragContext, StaticMapContext } from "../Components/StaticMapContext.js";
import { getBounds, lonLat2XY } from "../util/projection.js";

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
export function LightLayer() {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    const lights = useLights(getBounds(context));

    const projection = lonLat2XY(context);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top, left, lineHeight: 0, }}>
            {
                lights.map((light, i) => {
                    if (!light) return null;

                    const [x, y] = projection(light.lon, light.lat);

                    if (x < 0 || x > context.width || y < 0 || y > context.height) {
                        return null;
                    }

                    return <LightFlasher key={light.id} spec={light.spec} x={x} y={y} />;
                })
            }
        </div>
    );
}
