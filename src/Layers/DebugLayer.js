import { useContext, useEffect, useRef } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";
import React from "react";
import { getBounds } from "../util/projection";

const TILE_SIZE = 256;

export function DebugLayer ({}) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

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

        const fontSize = 20;

        const lonLatBounds = getBounds(context);
        const minTileX = lon2tile(lonLatBounds[0], context.zoom);
        const minTileY = lat2tile(lonLatBounds[3], context.zoom);
        const maxTileX = lon2tile(lonLatBounds[2], context.zoom);
        const maxTileY = lat2tile(lonLatBounds[1], context.zoom);

        const tileWidth = TILE_SIZE * devicePixelRatio;
        const tileHeight = TILE_SIZE * devicePixelRatio;

        const tileCountX = maxTileX - minTileX;
        const tileCountY = maxTileY - minTileY;

        const xOffset = (lon2tileFrac(lonLatBounds[0], context.zoom) - minTileX) * tileWidth;
        const yOffset = (lat2tileFrac(lonLatBounds[3], context.zoom) - minTileY) * tileHeight;

        // Gridlines
        ctx.beginPath();
        for (let x = -xOffset; x <= pxWidth; x += tileWidth) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, pxHeight);
        }
        for (let y = -yOffset; y <= pxHeight; y += tileHeight) {
            ctx.moveTo(0, y);
            ctx.lineTo(pxWidth, y);
        }
        ctx.strokeStyle = "black";
        ctx.stroke();

        const tileOffsetX = lon2tile(centre[0], zoom) - Math.floor(tileCountX / 2);
        const tileOffsetY = lat2tile(centre[1], zoom) - Math.floor(tileCountY / 2);

        // Tile ID
        ctx.fillStyle = "black";
        const pxFontSize = fontSize * devicePixelRatio;
        ctx.font = `${pxFontSize}px sans-serif`;
        for (let i = 0; i < tileCountX + 1; i++) {
            for (let j = 0; j < tileCountY + 1; j++) {
                ctx.fillText(`${tileOffsetX + i},${tileOffsetY + j},${zoom}`, i * tileWidth - xOffset + 10, j * tileHeight - yOffset + 10 + pxFontSize);
            }
        }

        const [ minLon, minLat, maxLon, maxLat ] = lonLatBounds;
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
        ctx.fillText(`${minLon.toFixed(3)}`, 0, pxHeight / 2);
        ctx.textAlign = "right";
        ctx.fillText(`${maxLon.toFixed(3)}`, pxWidth, pxHeight / 2);
        ctx.textAlign = "center";
        ctx.fillText(`${maxLat.toFixed(3)}`, pxWidth / 2, pxFontSize);
        ctx.fillText(`${minLat.toFixed(3)}`, pxWidth / 2, pxHeight);


    }, [centre, zoom, pxWidth, pxHeight]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0  }} />;
}
