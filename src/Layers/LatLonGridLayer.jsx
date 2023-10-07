import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import React from "react";
import { getBounds, lonLat2XY } from "../util/projection.js";


export function LatLonGridLayer () {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const [left,top] = useContext(DragContext);

    const context = useContext(StaticMapContext);
    const { centre, zoom, width, height } = context;

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) {
            return;
        }

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        const context = { centre, zoom, width, height };

        /** @type {"decimal"|"minutes"} */
        const mode = "minutes";

        // @ts-ignore
        if (mode === "decimal") {

            if (zoom > 14) {
                drawGrid(ctx, context, 1, 2);
                drawGrid(ctx, context, 0.1, 1);
                drawGrid(ctx, context, 0.01, 0.5, true);

            }
            else if (zoom > 10) {
                drawGrid(ctx, context, 1, 2);
                drawGrid(ctx, context, 0.1, 1, true);
            }
            else if (zoom > 5) {
                drawGrid(ctx, context, 1, 1, true);
            }
            else {
                drawGrid(ctx, context, 10, 2, true);
            }
        }
        else {
            if (zoom > 12) {
                drawGrid(ctx, context, 1, 2);
                drawGrid(ctx, context, 10 / 60, 1);
                drawGrid(ctx, context, 1 / 60, 0.5, true);

            }
            else if (zoom > 8) {
                drawGrid(ctx, context, 1, 2);
                drawGrid(ctx, context, 10 / 60, 1, true);
            }
            else if (zoom > 6) {
                drawGrid(ctx, context, 1, 1, true);
            }
            else {
                drawGrid(ctx, context, 10, 1, true);
            }
        }

    }, [centre, zoom, pxWidth, pxHeight, width, height]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width, height, position: "absolute", top, left  }} />;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ centre: [number, number]; zoom: number; width: number; height: number; }} context
 */
function drawGrid(ctx, context, gridSize = 1, lineWidth = 1, labels = false) {
    const lonLatBounds = getBounds(context);
    const { width, height } = context;

    const minLon = Math.floor(lonLatBounds[0]/gridSize)*gridSize;
    const minLat = Math.floor(lonLatBounds[1]/gridSize)*gridSize;
    const maxLon = Math.ceil(lonLatBounds[2]);
    const maxLat = Math.ceil(lonLatBounds[3]);

    const projection = lonLat2XY(context);

    const dpr = devicePixelRatio;

    ctx.beginPath();

    for (let i = minLon; i <= maxLon; i += gridSize) {
        const [x1,] = projection(i, minLat);
        const [x2,] = projection(i, maxLat);
        ctx.moveTo(x1 * dpr, 0);
        ctx.lineTo(x2 * dpr, height * dpr);
    }

    for (let j = minLat; j <= maxLat; j += gridSize) {
        const [, y1] = projection(minLon, j);
        const [, y2] = projection(maxLon, j);
        ctx.moveTo(0, y1 * dpr);
        ctx.lineTo(width * dpr, y2 * dpr);
    }

    ctx.strokeStyle = "#666";
    ctx.lineWidth = lineWidth * devicePixelRatio;

    ctx.stroke();

    if (labels) {
        const fontSize = 15 * devicePixelRatio;

        const precision = Math.max(0, -Math.log10(gridSize));

        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = "#666";

        ctx.textAlign = "left";
        for (let i = minLon; i <= maxLon; i += gridSize) {
            const [x] = projection(i, minLat);

            const margin = fontSize / 10;

            if (gridSize === 10/60 || gridSize === 1/60) {
                const degrees = Math.floor(i);
                const minutes = ((i % 1) * 60).toFixed(0).padStart(2, "0");
                ctx.fillText(`${degrees}°${minutes}′`, x * dpr, (context.height - margin) * dpr);
            }
            else {
                ctx.fillText(`${i.toFixed(precision)}°`, x * dpr, (context.height - margin) * dpr);
            }
        }

        ctx.textAlign = "right";
        for (let j = minLat; j <= maxLat; j += gridSize) {
            const [, y] = projection(maxLon, j);

            const margin = fontSize / 10;

            if (gridSize === 10/60 || gridSize === 1/60) {
                const degrees = Math.floor(j);
                const minutes = ((j % 1) * 60).toFixed(0).padStart(2, "0");
                ctx.fillText(`${degrees}°${minutes}′`, (context.width - margin) * dpr, (y - margin) * dpr);
            }
            else {
                ctx.fillText(`${j.toFixed(precision)}°`, (context.width - margin) * dpr, (y - margin) * dpr);
            }
        }
    }
}

