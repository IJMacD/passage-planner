import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { lonLat2XY } from "../util/projection.js";

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
 * @param {boolean} [props.outline]
 * @param {boolean} [props.showMagnitude]
 * @returns
 */
export function BarbFieldLayer({ field, scale = 10, outline = false, showMagnitude = false, }) {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

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
                const [x, y] = projection(point.lon, point.lat);

                /** @type {number} */
                let magnitude;
                /** @type {number} in Rads */
                let direction;

                if ("magnitude" in point) {
                    magnitude = point.magnitude;
                    direction = point.direction * Math.PI / 180;
                }
                else {
                    const [x, y] = point.vector;

                    direction = Math.atan2(y, x);
                    magnitude = Math.sqrt(x * x + y * y);
                }

                if (magnitude === 0) {
                    continue;
                }

                const t = 2 * devicePixelRatio;

                ctx.translate(x * devicePixelRatio, y * devicePixelRatio);
                ctx.rotate(direction + Math.PI);

                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.moveTo(10, 0);
                ctx.lineTo(100, 0);

                // Magnitude is in km/h
                const knots = magnitude * 0.539957;

                const halfBarbs = Math.round(knots / 5);
                const barbParity = halfBarbs % 2;

                if (halfBarbs === 1) { // Rounds to 5
                    const bx = 90;
                    ctx.moveTo(bx, 0);
                    ctx.lineTo(bx + 5, 10);
                }
                else {
                    let bx = 100;

                    for (let i = 0; i < Math.floor(halfBarbs / 2); i++) {
                        ctx.moveTo(bx, 0);
                        ctx.lineTo(bx + 10, 20);
                        bx -= 10;
                    }

                    if (barbParity) {
                        ctx.moveTo(bx, 0);
                        ctx.lineTo(bx + 5, 10);
                    }
                }

                if (outline) {
                    ctx.strokeStyle = "#FFF";
                    ctx.lineWidth = 2 * t;
                    ctx.stroke();
                }

                ctx.strokeStyle = "#000";
                ctx.lineWidth = t;
                ctx.lineCap = "round";

                ctx.stroke();

                ctx.resetTransform();

                if (showMagnitude) {
                    ctx.font = `${10 * devicePixelRatio}px sans-serif`;
                    ctx.fillText(knots.toFixed(1), x * devicePixelRatio, (y + 16) * devicePixelRatio);
                }
            }
        }


    }, [context, pxWidth, pxHeight, field, scale, outline, showMagnitude]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}

function getColour(value) {
    if (value < 2) return "#0093d3";
    if (value < 4) return "#00c800";
    if (value < 6) return "#eeee00";
    if (value < 8) return "#fa8a20";
    if (value < 10) return "#9934fd";
    return "#ff2d2d";
}