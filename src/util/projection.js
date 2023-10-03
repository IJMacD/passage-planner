import { lat2tileFrac, lon2tileFrac, tile2lat, tile2long } from "./geo.js";

export const TILE_SIZE = 256;

/**
 * @typedef {import("../Components/StaticMap").StaticMapContextValue} StaticMapContextValue
 */

/**
 * @param {StaticMapContextValue} context
 */
export function lonLat2XY({ centre, zoom, width, height }) {
    const centreTileX = lon2tileFrac(centre[0], zoom);
    const centreTileY = lat2tileFrac(centre[1], zoom);

    /**
     * @param {number} lon
     * @param {number} lat
     * @returns {[x: number, y: number]}
     */
    return (lon, lat) => {
        const tileX = lon2tileFrac(lon, zoom);
        const tileY = lat2tileFrac(lat, zoom);

        const x = (tileX - centreTileX) * TILE_SIZE + width / 2;
        const y = (tileY - centreTileY) * TILE_SIZE + height / 2;

        return [x, y];
    };
}

/**
 * @param {StaticMapContextValue} context
 */
export function xy2LonLat({ centre, zoom, width, height }) {

    const centreTileX = lon2tileFrac(centre[0], zoom);
    const centreTileY = lat2tileFrac(centre[1], zoom);

    // degrees per pixel
    const xScale = (tile2long(centreTileX + 1, zoom) - centre[0]) / TILE_SIZE;
    const yScale = (tile2lat(centreTileY + 1, zoom) - centre[1]) / TILE_SIZE;

    /**
     * @param {number} x
     * @param {number} y
     */
    return (x, y) => {
        const xDelta = x - width / 2;
        const yDelta = y - height / 2;

        return [
            centre[0] + xDelta * xScale,
            centre[1] + yDelta * yScale,
        ];
    }
}

/**
 * Returns (x,y) co-ordinate of top left corner
 * @param {StaticMapContextValue} context
 */
export function tileXY2CanvasXY({ centre, zoom, width, height }) {
    const tileOffsetX = lon2tileFrac(centre[0], zoom);
    const tileOffsetY = lat2tileFrac(centre[1], zoom);

    const imageOffsetX = width / 2;
    const imageOffsetY = height / 2;

    /**
     * @param {number} tileX
     * @param {number} tileY
     */
    return (tileX, tileY) => {
        const i = tileX - tileOffsetX;
        const j = tileY - tileOffsetY;

        const x = i * TILE_SIZE + imageOffsetX;
        const y = j * TILE_SIZE + imageOffsetY;

        return [x, y];
    };
}

/**
 * @param {StaticMapContextValue} context
 */
export function lonLat2TileXY({ zoom }) {
    /**
     * @param {number} lon
     * @param {number} lat
     */
    return (lon, lat) => [lon2tileFrac(lon, zoom), lat2tileFrac(lat, zoom)];
}


/**
 * @param {StaticMapContextValue} context
 * @returns {[minLon: number, minLat: number, maxLon: number, maxLat: number]} [minLon, minLat, maxLon, maxLat]
 */
export function getBounds(context) {
    const projection = xy2LonLat(context);
    const bottomLeft = projection(0, context.height);
    const topRight = projection(context.width, 0);

    return [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];
}

/**
 * @param {[minLon: number, minLat: number, maxLon: number, maxLat: number]} bounds
 */
export function filterByBounds (bounds) {
    return (/** @type {{ lon: Number, lat: number}} */ item) => {
        return item.lon >= bounds[0] && item.lat >= bounds[1] && item.lon <= bounds[2] && item.lat <= bounds[3];
    };
}