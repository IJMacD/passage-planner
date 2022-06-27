import { useContext, useEffect, useRef } from "react";
import { lat2tile, lon2tile } from "../geo";
import { StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

export function ImageLayer ({ image, bounds }) {
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

        const tileCountX = width / tileWidth;
        const tileCountY = height / tileHeight;

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        const tilesAtZoom = Math.pow(2, zoom);

        const fractionOfWorldX = tileCountX / tilesAtZoom;
        const fractionOfWorldY = tileCountY / tilesAtZoom;

        const blownUpImageWidth = width / fractionOfWorldX;
        const blownUpImageHeight = height / fractionOfWorldY;

        ctx.drawImage(image, -tileOffsetX * tileWidth, -tileOffsetY * tileHeight, blownUpImageWidth, blownUpImageHeight);

    }, [centre, zoom, pxWidth, pxHeight, image]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
