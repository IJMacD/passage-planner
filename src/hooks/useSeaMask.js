import { useContext, useEffect, useState } from "react";
import { StaticMapContext } from "../Components/StaticMapContext.js";
import { getTiles } from "../util/getTiles.js";
import { loadImage } from "../util/loadImage.js";
import { renderCanvasTileLayer } from "../canvas-renderers/renderCanvasTileLayer.js";
import { clampAlpha, maskCanvas } from "../util/maskCanvas.js";
import { useTileJSON } from "./useTileJSON.js";

export function useSeaMask() {
    const [canvas, setCanvas] = useState(/** @type {HTMLCanvasElement?} */(null));

    const layer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    const context = useContext(StaticMapContext);

    useEffect(() => {
        let isCurrent = { value: true };

        setCanvas(null);

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

        Promise.all(tiles.map(tile => loadImage(tile.url))).then(images => {
            if (isCurrent.value) {
                const canvas = document.createElement("canvas");

                canvas.width = context.width * devicePixelRatio;
                canvas.height = context.height * devicePixelRatio;

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

                setCanvas(canvas);
            }
        });

        return () => { isCurrent.value = false };
    }, [context, layer]);

    return canvas;
}
