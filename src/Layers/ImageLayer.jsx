import React, { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { lonLat2XY } from "../util/projection.js";

/**
 *
 * @param {object} props
 * @param {HTMLImageElement} props.image
 * @param {[west: number, south: number, east: number, north: number]} props.bounds
 * @returns
 */
export function ImageLayer ({ image, bounds }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const [left,top] = useContext(DragContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const [ west, south, east, north ] = bounds;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) return;

        const pxWidth = width * devicePixelRatio;
        const pxHeight = height * devicePixelRatio;

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        const projection = lonLat2XY({ centre, zoom, width, height });

        const pxTopLeft = projection(west, north);
        const pxBottomRight = projection(east, south);

        const dx = pxTopLeft[0] * devicePixelRatio;
        const dy = pxTopLeft[1] * devicePixelRatio;
        const dw = (pxBottomRight[0] - pxTopLeft[0]) * devicePixelRatio;
        const dh = (pxBottomRight[1] - pxTopLeft[1]) * devicePixelRatio;

        const sx = 0;
        const sy = 0;
        const sw = image.width;
        const sh = image.height;

        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

    }, [image, centre, zoom, width, height, west, south, east, north]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
