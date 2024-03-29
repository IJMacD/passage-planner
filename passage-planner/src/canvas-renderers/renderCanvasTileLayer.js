import { tileXY2CanvasXY } from "../util/projection.js";

const TILE_SIZE = 256;
const DEBUG = false;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{centre: [number, number]; zoom: number; width: number; height: number; }} context
 * @param {{url: string; x: number; y: number;}[]} tiles
 * @param {number} overscale
 * @param {HTMLImageElement[]} images
 */
export function renderCanvasTileLayer(canvas, context, tiles, images, overscale) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw Error("Cannot get 2D context");
    }

    const projection = tileXY2CanvasXY(context);

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const img = images[i];

        if (!img)
            continue;

        const [x, y] = projection(tile.x * overscale, tile.y * overscale);

        ctx.drawImage(img,
            x * devicePixelRatio,
            y * devicePixelRatio,
            TILE_SIZE * devicePixelRatio * overscale,
            TILE_SIZE * devicePixelRatio * overscale
        );

        if (DEBUG) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#F00";
            ctx.strokeRect(
                x * devicePixelRatio,
                y * devicePixelRatio,
                TILE_SIZE * devicePixelRatio * overscale,
                TILE_SIZE * devicePixelRatio * overscale
            );
        }
    }
}
