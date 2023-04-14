import { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap.js";
import { lonLat2XY } from "../util/projection.js";
import React from "react";

/**
 *
 * @param {object} props
 * @param {{ latitude: number, longitude: number, magnitude: number, direction: number }[]} props.field
 * @returns
 */
export function VectorFieldLayer ({ field }) {
    const context = useContext(StaticMapContext);

    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    const { width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (ctx) {
            ctx.canvas.width = pxWidth;
            ctx.canvas.height = pxHeight;

            const projection = lonLat2XY(context);

            for (const point of field) {
                const [ x, y ] = projection(point.longitude, point.latitude);

                const r = 10 * point.magnitude * devicePixelRatio;
                const t = r / 5;

                ctx.translate(x*devicePixelRatio, y*devicePixelRatio);
                ctx.rotate(point.direction / 180 * Math.PI + Math.PI);

                ctx.beginPath();
                ctx.moveTo(0, -2*r);
                ctx.lineTo(0, r);
                ctx.moveTo(r, 0);
                ctx.lineTo(0, r);
                ctx.lineTo(-r, 0);
                ctx.strokeStyle = getColour(point.magnitude);
                ctx.lineCap = "round";
                ctx.lineWidth = t;
                ctx.stroke();

                ctx.resetTransform();
            }
        }


    }, [context, pxWidth, pxHeight, field]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}

function getColour (value) {
    if (value < 0.5) return "#0093d3";
    if (value < 1.0) return "#00c800";
    if (value < 1.5) return "#eeee00";
    if (value < 2.0) return "#fa8a20";
    if (value < 2.5) return "#9934fd";
    return "#ff2d2d";
}