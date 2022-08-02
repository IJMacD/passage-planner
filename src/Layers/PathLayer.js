import React, { useContext, useEffect, useRef } from "react";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {{ points: { lon: number; lat: number; }[], color?: string?; lineDash?: number[]? }[]} props.paths
 * @returns
 */
export function PathLayer ({ paths }) {
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

        const tileWidth = TILE_SIZE * devicePixelRatio;
        const tileHeight = TILE_SIZE * devicePixelRatio;

        const tileCountX = pxWidth / tileWidth;
        const tileCountY = pxHeight / tileHeight;

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        const minLon = tile2long(tileOffsetX, zoom);
        const minLat = tile2lat(tileOffsetY, zoom);
        const maxLon = tile2long(tileOffsetX + tileCountX, zoom);
        const maxLat = tile2lat(tileOffsetY + tileCountY, zoom);

        for (const path of paths) {

            ctx.strokeStyle = path.color ?? "red";

            ctx.lineWidth = 2 * devicePixelRatio;
            ctx.beginPath();

            for (const point of path.points) {
                const lonFrac = (point.lon-minLon)/(maxLon-minLon);
                const latFrac = (point.lat-minLat)/(maxLat-minLat);

                const x = lonFrac * pxWidth;
                const y = latFrac * pxHeight;

                ctx.lineTo(x, y);

            }

            if (path.lineDash) {
                ctx.setLineDash(path.lineDash.map(x => x * devicePixelRatio));
            }
            else {
                ctx.setLineDash([]);
            }

            ctx.stroke();
        }


    }, [centre, zoom, pxWidth, pxHeight, paths]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
