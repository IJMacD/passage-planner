import React, { useContext, useEffect, useRef } from "react";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo";
import { lonLat2XY, StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {{ points: { lon: number; lat: number; }[], color?: string?; lineDash?: number[]? }[]} props.paths
 * @returns
 */
export function PathLayer ({ paths }) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const context = useContext(StaticMapContext);

    const pxWidth = context.width * devicePixelRatio;
    const pxHeight = context.height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) return;

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        for (const path of paths) {
            ctx.strokeStyle = path.color ?? "red";

            ctx.lineWidth = 2 * devicePixelRatio;
            ctx.beginPath();

            for (const point of path.points) {
                const [x, y] = lonLat2XY(point.lon, point.lat, context);

                ctx.lineTo(x * devicePixelRatio, y * devicePixelRatio);
            }

            if (path.lineDash) {
                ctx.setLineDash(path.lineDash.map(v => v * devicePixelRatio));
            }
            else {
                ctx.setLineDash([]);
            }

            ctx.stroke();
        }


    }, [context.centre[0], context.centre[1], context.zoom, pxWidth, pxHeight, paths]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
