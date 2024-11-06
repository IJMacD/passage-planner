import { useContext, useEffect, useRef } from "react";
import { getVesselColours } from "../Components/getVesselColours.jsx";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { lonLat2XY } from "../util/projection.js";
import React from "react";

/**
 *
 * @param {object} props
 * @param {import("../util/ais/ais.js").Vessel[]} props.vessels
 * @returns
 */
export function AISLayerCanvas({ vessels }) {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const { width, height } = context;

    const dpr = devicePixelRatio;

    const pxWidth = width * dpr;
    const pxHeight = height * dpr;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) return;

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        const projection = lonLat2XY(context);

        for (const vessel of vessels) {
            const [x, y] = projection(vessel.longitude, vessel.latitude);

            ctx.save();

            ctx.translate(x * dpr, y * dpr);

            const [dark, light] = getVesselColours(vessel);

            if (vessel.name) {
                ctx.fillStyle = dark;
                ctx.font = `${10 * dpr}px sans-serif`;
                ctx.fillText(vessel.name, 10 * dpr, 0);
            }

            ctx.strokeStyle = dark;
            ctx.fillStyle = light;

            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();

            if (vessel.speedOverGround === 0) {
                ctx.arc(0, 0, 5 * dpr, 0, Math.PI * 2);
            }
            else {
                ctx.rotate(vessel.courseOverGround / 180 * Math.PI);

                const r = 5 * dpr;

                ctx.moveTo(0, -r * 2);
                ctx.lineTo(r, r);
                ctx.lineTo(0, r / 2);
                ctx.lineTo(-r, r);
                ctx.closePath()
                ctx.lineCap = "round";

                // ctx.resetTransform();
            }

            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }


    }, [context, pxWidth, pxHeight, vessels, dpr]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
