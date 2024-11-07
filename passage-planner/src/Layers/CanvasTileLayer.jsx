import React, { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { getTiles } from "../util/getTiles.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { loadImage } from "../util/loadImage.js";

/**
 *
 * @param {object} props
 * @param {import("./TileMapLayer.jsx").TileJSON} props.layer
 * @param {import("react").CSSProperties} [props.style]
 * @returns
 */
export function CanvasTileLayer({ layer, style = {} }) {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    useEffect(() => {
        if (canvasRef.current) {
            let isCurrent = { value: true };

            let { centre, zoom, width, height } = context;

            let overscale = 1;

            if (zoom < 0) {
                return;
            }

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

            const tiles = getTiles(centre, zoom, width / overscale, height / overscale, layer);

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
    }, [context]);

    return <canvas ref={canvasRef} style={{ ...style, width: "100%", height: "100%", position: "absolute", top, left }} />;
}
