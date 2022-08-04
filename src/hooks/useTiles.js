import { useRef } from "react";
import { lat2tile, lon2tile } from "../util/geo";

const TILE_SIZE = 265;

/**
 * @param {[number, number]} centre
 * @param {number} zoom
 * @param {number} width
 * @param {number} height
 * @param {Layer} layer
 */
export function useTiles(centre, zoom, width, height, layer) {
    const tiles = [];

    if (zoom >= +layer.minzoom && zoom <= +layer.maxzoom) {
        const tileCountX = Math.ceil(width / TILE_SIZE) + 2;
        const tileCountY = Math.ceil(height / TILE_SIZE) + 2;

        const tileOffsetX = lon2tile(centre[0], zoom) - Math.floor(tileCountX / 2);
        const tileOffsetY = lat2tile(centre[1], zoom) - Math.floor(tileCountY / 2);

        const layerBounds = layer.bounds.split(",");
        const layerMinX = lon2tile(+layerBounds[0], zoom);
        const layerMinY = lat2tile(+layerBounds[3], zoom);
        const layerMaxX = lon2tile(+layerBounds[2], zoom);
        const layerMaxY = lat2tile(+layerBounds[1], zoom);

        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                const x = tileOffsetX + i;
                const y = tileOffsetY + j;

                if (x >= layerMinX && x <= layerMaxX && y >= layerMinY && y <= layerMaxY) {
                    const url = `${layer.baseURL}/${zoom}/${x}/${y}.png`;
                    tiles.push({ x, y, url });
                }
            }
        }
    }

    // Return a stable object array
    // If all the URLs are the same then just return the cached result
    const resultRef = useRef(tiles);
    const urlList = tiles.map(t => t.url);
    const urlRef = useRef(urlList);

    if (!areArraysEqual(urlList, urlRef.current)) {
        resultRef.current = tiles;
        urlRef.current = urlList;
    }

    return resultRef.current;
}

/**
 * @param {any[]} array1
 * @param {any[]} array2
 */
function areArraysEqual (array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }

    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}
