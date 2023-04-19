import React, { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import { useTiles } from "../hooks/useTiles.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { loadImage } from "../util/loadImage.js";

export const TILE_SIZE = 256;
export const DEBUG = false;

/**
 *
 * @param {object} props
 * @param {import("./TileMapLayer").TileJSON} props.layer
 * @returns
 */
export function CanvasTileLayer ({ layer }) {
    const context = useContext(StaticMapContext);

    const [left,top] = useContext(DragContext);

    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    let { centre, zoom, width, height } = context;

    let overscale = 1;

    if (zoom < +layer.minzoom) {
        overscale = 1 / Math.pow(2, +layer.minzoom - zoom);
        zoom = +layer.minzoom;
    }
    else if (zoom > +layer.maxzoom) {
        overscale = Math.pow(2, zoom - +layer.maxzoom);
        zoom = +layer.maxzoom;
    }
    else if (zoom !== Math.ceil(zoom)) {
        overscale = Math.pow(2, zoom - Math.ceil(zoom));
        zoom = Math.ceil(zoom);
    }

    const tiles = useTiles(centre, zoom, width / overscale, height / overscale, layer);

    useEffect(() => {
    // useEffectDebugger(() => {
    //     console.log("CanvasTileLayer: render");
        if (canvasRef.current) {
            let isCurrent = true;
            let hasLoaded = false;

            Promise.all(tiles.map(tile =>
                // Failure to load one image won't stop the entire
                // canvas from rendering.
                loadImage(tile.url).catch(() => console.log("error loading " + tile.url))
            )).then(images => {
                hasLoaded = true;

                if (canvasRef.current && isCurrent) {
                    canvasRef.current.width = context.width * devicePixelRatio;
                    canvasRef.current.height = context.height * devicePixelRatio;

                    renderCanvasTileLayer(canvasRef.current, context, tiles, images, overscale);
                }
            });

            // Clear canvas if image loading is taking too long
            setTimeout(() => {
                if (isCurrent && !hasLoaded && canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    const w = canvasRef.current.width;
                    const h = canvasRef.current.height;
                    ctx?.clearRect(0, 0, w, h);
                }
            }, 1500);

            return () => { isCurrent = false };
        }
    }, [tiles, overscale, context]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
