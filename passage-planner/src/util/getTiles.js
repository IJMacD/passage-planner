import { lat2tile, lon2tile } from "./geo.js";

export const TILE_SIZE = 265;

/**
 * @param {[number, number]} centre
 * @param {number} zoom
 * @param {number} width
 * @param {number} height
 * @param {import("../Layers/TileMapLayer.jsx").TileJSON|null} layer
 */

export function getTiles(centre, zoom, width, height, layer) {
    const tiles = [];

    if (!isFinite(width) || !isFinite(height)) {
        return tiles;
    }

    if (layer && zoom >= +layer.minzoom && zoom <= +layer.maxzoom) {
        const tileCountX = Math.ceil(width / TILE_SIZE) + 2;
        const tileCountY = Math.ceil(height / TILE_SIZE) + 2;

        const tileOffsetX = lon2tile(centre[0], zoom) - Math.floor(tileCountX / 2);
        const tileOffsetY = lat2tile(centre[1], zoom) - Math.floor(tileCountY / 2);

        const layerMinX = lon2tile(layer.bounds[0], zoom);
        const layerMinY = lat2tile(layer.bounds[3], zoom);
        const layerMaxX = lon2tile(layer.bounds[2], zoom);
        const layerMaxY = lat2tile(layer.bounds[1], zoom);

        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                const x = tileOffsetX + i;
                const y = tileOffsetY + j;

                if (x >= layerMinX && x <= layerMaxX && y >= layerMinY && y <= layerMaxY) {
                    const url = formatTileURL(layer, zoom, x, y);
                    tiles.push({ x, y, url });
                }
            }
        }
    }

    return tiles;
}

/**
 * @param {import("../Layers/TileMapLayer.jsx").TileJSON} layer
 * @param {number} z
 * @param {number} x
 * @param {number} y
 */
export function formatTileURL(layer, z, x, y) {
    const l = layer.tiles.length | 0;
    // Don't use Math.random(). We need to be deterministic
    const template = layer.tiles[(z + x + y) % l];
    return template.replace(/{([xyz])}/g, (_, t) => ({ z, x, y }[t]));
}