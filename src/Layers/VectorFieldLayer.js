import { useContext, useEffect, useRef } from "react";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../geo";
import { StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {{ latitude: number, longitude: number, magnitude: number, direction: number }[]} props.field
 * @returns
 */
export function VectorFieldLayer ({ field }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement>} */
    const canvasRef = useRef(null);

    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

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


        for (const point of field) {
            const lonFrac = (point.longitude-minLon)/(maxLon-minLon);
            const latFrac = (point.latitude-minLat)/(maxLat-minLat);

            if (lonFrac >= 0 && lonFrac <= 1 && latFrac >= 0 && latFrac <= 1) {
                const x = lonFrac * pxWidth;
                const y = latFrac * pxHeight;
                const r = 10 * point.magnitude * devicePixelRatio;
                const t = r / 5;

                ctx.translate(x, y);
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


    }, [centre, zoom, pxWidth, pxHeight, field]);

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