import React, { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap.js";
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

    const tiles = useTiles(centre, zoom, width / overscale, height / overscale, layer);

    useEffect(() => {
    // useEffectDebugger(() => {
    //     console.log("CanvasTileLayer: render");
        if (canvasRef.current) {
            let isCurrent = true;

            Promise.all(tiles.map(tile =>
                // Failure to load one image won't stop the entire
                // canvas from rendering.
                loadImage(tile.url).catch(() => console.log("error loading " + tile.url))
            )).then(images => {
                if (canvasRef.current && isCurrent) {
                    canvasRef.current.width = context.width * devicePixelRatio;
                    canvasRef.current.height = context.height * devicePixelRatio;

                    renderCanvasTileLayer(canvasRef.current, context, tiles, images, overscale);
                }
            });

            return () => { isCurrent = false };
        }
    }, [tiles, overscale, context]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
