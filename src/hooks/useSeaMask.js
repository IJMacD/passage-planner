import { useContext, useEffect } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { useTiles } from "./useTiles.js";
import { loadImage } from "../util/loadImage.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { clampAlpha, maskCanvas } from "../util/maskCanvas.js";

/**
 * @param {import("./useTileJSONList.js").TileJSON | null} layer
 * @param {HTMLCanvasElement | null} canvas
 */
export function useSeaMask (layer, canvas) {
    const context = useContext(StaticMapContext);

    let { centre, zoom, width, height } = context;

    let overscale = 1;

    if (layer) {
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
    }

    const tiles = useTiles(centre, zoom, width / overscale, height / overscale, layer);

    useEffect(() => {
        let isCurrent = { value: true };

        (async function () {
            if (canvas) {
                // Clear canvas
                canvas.width = context.width * devicePixelRatio;
                canvas.height = context.height * devicePixelRatio;

                const images = await Promise.all(tiles.map(tile => loadImage(tile.url)));

                if (canvas && isCurrent.value) {
                    // Force software rendering for this canvas
                    canvas.getContext("2d", { willReadFrequently: true });

                    renderCanvasTileLayer(canvas, context, tiles, images, overscale);

                    maskCanvas(canvas, {
                        searchColour: "#F2C86D",
                        searchTolerance: 40,
                        matchColour: "#00000000",
                        nonMatchColour: "#000000FF",
                        blur: 4,
                    });

                    clampAlpha(canvas, 225);
                }
            }
        }());

        return () => { isCurrent.value = false };
    }, [canvas, layer, context, overscale, tiles]);
}
