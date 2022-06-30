import { useContext, useEffect, useRef } from "react";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

export function DebugLayer ({}) {
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
        const fontSize = 20;

        const tileWidth = TILE_SIZE * devicePixelRatio;
        const tileHeight = TILE_SIZE * devicePixelRatio;

        const tileCountX = width / TILE_SIZE;
        const tileCountY = height / TILE_SIZE;

        // Gridlines
        ctx.beginPath();
        for (let x = 0; x <= pxWidth; x += tileWidth) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, pxHeight);
        }
        for (let y = 0; y <= pxHeight; y += tileHeight) {
            ctx.moveTo(0, y);
            ctx.lineTo(pxWidth, y);
        }
        ctx.strokeStyle = "black";
        ctx.stroke();

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        // Tile ID
        ctx.fillStyle = "black";
        const pxFontSize = fontSize * devicePixelRatio;
        ctx.font = `${pxFontSize}px sans-serif`;
        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                ctx.fillText(`${tileOffsetX + i},${tileOffsetY + j},${zoom}`, i * tileWidth + 10, j * tileHeight + 10 + pxFontSize);
            }
        }

        const minLon = tile2long(tileOffsetX, zoom);
        const maxLat = tile2lat(tileOffsetY, zoom);
        const maxLon = tile2long(tileOffsetX + tileCountX, zoom);
        const minLat = tile2lat(tileOffsetY + tileCountY, zoom);
        const lonFrac = (centre[0]-minLon)/(maxLon-minLon);
        const latFrac = (maxLat-centre[1])/(maxLat-minLat);

        ctx.translate(pxWidth * lonFrac, pxHeight * latFrac);

        // Centre Cross-Hairs
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.strokeStyle = "red";
        ctx.stroke();

        // Centre Coords
        ctx.fillStyle = "red";
        ctx.font = `${pxFontSize}px sans-serif`;
        ctx.fillText(`(${centre[0]},${centre[1]})`, 10 + pxFontSize, 10);

        ctx.resetTransform();

        // Bounds
        ctx.fillText(`${minLon.toFixed(3)}`, pxFontSize, pxHeight / 2);
        ctx.fillText(`${maxLon.toFixed(3)}`, pxWidth - pxFontSize * 4, pxHeight / 2);
        ctx.fillText(`${maxLat.toFixed(2)}`, pxWidth / 2, 10 + pxFontSize * 2);
        ctx.fillText(`${minLat.toFixed(2)}`, pxWidth / 2, pxHeight - 10 - pxFontSize);


    }, [centre, zoom, pxWidth, pxHeight]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0  }} />;
}
