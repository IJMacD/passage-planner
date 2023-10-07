import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import { lonLat2XY } from "../util/projection.js";
import React from "react";

/**
 * @typedef PolarFieldPoint
 * @property {number} lat
 * @property {number} lon
 * @property {number} magnitude
 * @property {number} direction In degrees
 */

/**
 * @typedef {{ lat: number; lon: number; vector: [number, number] }} VectorFieldPoint
 */

/**
 * @typedef {(PolarFieldPoint|VectorFieldPoint)[]} Field
 */

/**
 *
 * @param {object} props
 * @param {Field} props.field
 * @param {number} [props.scale]
 * @returns
 */
export function VectorFieldLayer ({ field, scale = 10 }) {
    const context = useContext(StaticMapContext);

    const [left,top] = useContext(DragContext);

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
                const [ x, y ] = projection(point.lon, point.lat);

                /** @type {number} */
                let magnitude;
                /** @type {number} in Rads */
                let direction;

                if ("magnitude" in point) {
                    magnitude = point.magnitude;
                    direction = point.direction * Math.PI / 180;
                }
                else {
                    const [ x, y ] = point.vector;
                    direction = Math.atan2(y, x);
                    magnitude = Math.sqrt(x * x + y * y);
                }

                const value = scale * magnitude;

                const r = value * devicePixelRatio;
                const t = r / 5;

                ctx.translate(x*devicePixelRatio, y*devicePixelRatio);
                ctx.rotate(direction + Math.PI);

                ctx.beginPath();
                ctx.moveTo(0, -2*r);
                ctx.lineTo(0, r);
                ctx.moveTo(r, 0);
                ctx.lineTo(0, r);
                ctx.lineTo(-r, 0);
                ctx.strokeStyle = getColour(value);
                ctx.lineCap = "round";
                ctx.lineWidth = t;
                ctx.stroke();

                ctx.resetTransform();
            }
        }


    }, [context, pxWidth, pxHeight, field, scale]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}

function getColour (value) {
    if (value < 2) return "#0093d3";
    if (value < 4) return "#00c800";
    if (value < 6) return "#eeee00";
    if (value < 8) return "#fa8a20";
    if (value < 10) return "#9934fd";
    return "#ff2d2d";
}