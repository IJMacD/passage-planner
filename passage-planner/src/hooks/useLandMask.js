import { useContext, useEffect, useState } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { getTiles } from "../util/getTiles.js";
import { loadImage } from "../util/loadImage.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { maskCanvas } from "../util/maskCanvas.js";

/**
 * @param {import("./useTileJSONList.js").TileJSON | null} layer
 */
export function useLandMask (layer) {
    const [ canvas, setCanvas ] = useState(/** @type {HTMLCanvasElement?} */(null))
    const context = useContext(StaticMapContext);

    useEffect(() => {
        let isCurrent = { value: true };

        setCanvas(null);

        (async function () {
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

            const tiles = getTiles(centre, zoom, width / overscale, height / overscale, layer);

            const images = await Promise.all(tiles.map(tile => loadImage(tile.url)));

            if (isCurrent.value) {

                const canvas = document.createElement("canvas");
                // Clear canvas
                canvas.width = context.width * devicePixelRatio;
                canvas.height = context.height * devicePixelRatio;

                renderCanvasTileLayer(canvas, context, tiles, images, overscale);

                maskCanvas(canvas, {
                    searchColour: "#F2C86D",
                    searchTolerance: 40,
                    matchColour: "#000000FF",
                    nonMatchColour: "#00000000",
                    blur: 4,
                });

                setCanvas(canvas);
            }
        }());

        return () => { isCurrent.value = false };
    }, [layer, context]);

    return canvas;
}
