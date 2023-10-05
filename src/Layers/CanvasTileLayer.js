import React, { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import { useTiles } from "../hooks/useTiles.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { loadImage } from "../util/loadImage.js";

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
        if (canvasRef.current) {
            let isCurrent = { value: true };

            // Clear canvas
            canvasRef.current.width = context.width * devicePixelRatio;
            canvasRef.current.height = context.height * devicePixelRatio;

            // Load each image and render whenever it's ready
            for (const tile of tiles) {
                loadImage(tile.url).then(image => {
                    if (canvasRef.current && isCurrent.value) {
                        renderCanvasTileLayer(canvasRef.current, context, [tile], [image], overscale);
                    }
                });
            }

            return () => { isCurrent.value = false };
        }
    }, [tiles, overscale, context]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
