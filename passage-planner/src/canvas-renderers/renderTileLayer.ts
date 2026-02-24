import { TileJSON } from "../Layers/TileMapLayer";
import { getTiles } from "../util/getTiles";
import { loadImage } from "../util/loadImage";
import { renderCanvasTileLayer } from "./renderCanvasTileLayer";

export async function renderTileLayer(canvas: HTMLCanvasElement, context: { height: number; width: number; centre: [number, number]; zoom: number; }, tiles: TileJSON) {
    let { centre, zoom, width, height } = context;

    let overscale = 1;

    if (zoom < 0) {
        return Promise.reject(new Error("Zoom level cannot be negative"));
    }

    if (zoom < +tiles.minzoom) {
        overscale = 1 / Math.pow(2, +tiles.minzoom - zoom);
        zoom = +tiles.minzoom;
    }
    else if (zoom > +tiles.maxzoom) {
        overscale = Math.pow(2, zoom - +tiles.maxzoom);
        zoom = +tiles.maxzoom;
    }
    else if (zoom !== Math.ceil(zoom)) {
        overscale = Math.pow(2, zoom - Math.ceil(zoom));
        zoom = Math.ceil(zoom);
    }

    const tileData = getTiles(centre, zoom, width / overscale, height / overscale, tiles);

    // Load all images and render whenever they're ready
    const images = await Promise.all(tileData.map(tile => loadImage(tile.url)));
    // Clear canvas
    canvas.width = context.width * devicePixelRatio;
    canvas.height = context.height * devicePixelRatio;
    renderCanvasTileLayer(canvas, context, tileData, images, overscale);
}
