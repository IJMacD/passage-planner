import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
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

        if (zoom > 14) {
            drawGrid(ctx, context, 1, 2);
            drawGrid(ctx, context, 0.1, 1);
            drawGrid(ctx, context, 0.01, 0.5, true);

        }
        else if (zoom > 10) {
            drawGrid(ctx, context, 1, 2);
            drawGrid(ctx, context, 0.1, 1, true);
        }
        else {
            drawGrid(ctx, context, 1, 2, true);
        }

    }, [centre, zoom, pxWidth, pxHeight, width, height]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left  }} />;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ centre: [number, number]; zoom: number; width: number; height: number; }} context
 */
function drawGrid(ctx, context, gridSize = 1, lineWidth = 1, labels = false) {
    const lonLatBounds = getBounds(context);

    const minLon = Math.floor(lonLatBounds[0]);
    const minLat = Math.floor(lonLatBounds[1]);
    const maxLon = Math.ceil(lonLatBounds[2]);
    const maxLat = Math.ceil(lonLatBounds[3]);

    const projection = lonLat2XY(context);

    ctx.beginPath();

    for (let i = minLon; i <= maxLon; i += gridSize) {
        const [x1, y1] = projection(i, minLat);
        const [x2, y2] = projection(i, maxLat);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    for (let j = minLat; j <= maxLat; j += gridSize) {
        const [x1, y1] = projection(minLon, j);
        const [x2, y2] = projection(maxLon, j);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
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
            ctx.fillText(`${i.toFixed(precision)}°`, x, context.height);
        }

        ctx.textAlign = "right";
        for (let j = minLat; j <= maxLat; j += gridSize) {
            const [, y] = projection(maxLon, j);
            ctx.fillText(`${j.toFixed(precision)}°`, context.width, y - fontSize / 10);
        }
    }
}
