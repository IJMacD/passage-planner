import { useContext, useEffect, useRef } from "react";
import { getVesselColours } from "../util/ais.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import { lonLat2XY } from "../util/projection.js";
import React from "react";

/**
 *
 * @param {object} props
 * @param {import("../util/ais").Vessel[]} props.vessels
 * @returns
 */
export function AISLayerCanvas ({ vessels }) {
    const context = useContext(StaticMapContext);

    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) return;

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        const projection = lonLat2XY(context);

        for (const vessel of vessels) {
            const [x, y] = projection(vessel.longitude, vessel.latitude);

            ctx.translate(x, y);

            const [ dark, light ] = getVesselColours(vessel);

            if (vessel.name) {
                ctx.fillStyle = dark;
                ctx.font = `${10 * devicePixelRatio}px sans-serif`;
                ctx.fillText(vessel.name, 10 * devicePixelRatio, 0);
            }

            ctx.strokeStyle = dark;
            ctx.fillStyle = light;

            ctx.lineWidth = 2 * devicePixelRatio;
            ctx.beginPath();

            if (vessel.speedOverGround === 0) {
                ctx.arc(0, 0, 5 * devicePixelRatio, 0, Math.PI * 2);
            }
            else {
                ctx.rotate(vessel.courseOverGround / 180 * Math.PI + Math.PI);

                const r = 5 * devicePixelRatio;

                ctx.moveTo(0, -r * 2);
                ctx.lineTo(r, r);
                ctx.lineTo(0, 0);
                ctx.lineTo(-r, r);
                ctx.closePath()
                ctx.lineCap = "round";

                ctx.resetTransform();
            }

            ctx.fill();
            ctx.stroke();
        }


    }, [context, pxWidth, pxHeight, vessels]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
