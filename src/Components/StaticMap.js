import React from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac, tile2lat, tile2long } from "../util/geo";

/**
 * @typedef StaticMapContextValue
 * @prop {[number, number]} centre
 * @prop {number} zoom
 * @prop {number} width
 * @prop {number} height
 */

export const StaticMapContext = React.createContext({
    centre: /** @type {[number, number]} */([0, 0]),
    zoom: 8,
    width: 1024,
    height: 1024,
});

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {[number,number]} props.centre
 * @param {number} props.zoom
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {(lon: number, lat: number, e: import('react').MouseEvent) => void} [props.onClick]
 * @param {React.ReactChild[]} [props.children]
 * @returns
 */
export function StaticMap ({ centre, zoom, width = 1024, height = 1024, onClick, children }) {

    /**
     * @param {import("react").MouseEvent<HTMLDivElement>} e
     */
    function handleClick (e) {
        if(onClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const [ lon, lat ] = xy2LonLat(x, y, { centre, zoom, width, height });

            onClick(lon, lat, e);
        }
    }

    return (
        <div style={{ position: "relative", width, height, minWidth: width }} onClick={handleClick}>
            <StaticMapContext.Provider value={{ centre, zoom, width, height }}>
                { children }
            </StaticMapContext.Provider>
        </div>
    );
}

/**
 * @param {number} lon
 * @param {number} lat
 * @param {StaticMapContextValue} context
 */
export function lonLat2XY (lon, lat, { centre, zoom, width, height }) {
    const centreTileX = lon2tileFrac(centre[0], zoom);
    const centreTileY = lat2tileFrac(centre[1], zoom);

    const tileX = lon2tileFrac(lon, zoom);
    const tileY = lat2tileFrac(lat, zoom);

    const x = (tileX - centreTileX) * TILE_SIZE + width / 2;
    const y  = (tileY - centreTileY) * TILE_SIZE + height / 2;

    return [x, y];
}

/**
 * @param {number} x
 * @param {number} y
 * @param {StaticMapContextValue} context
 */
export function xy2LonLat (x, y, { centre, zoom, width, height }) {

    const centreTileX = lon2tileFrac(centre[0], zoom);
    const centreTileY = lat2tileFrac(centre[1], zoom);

    // degrees per pixel
    const xScale = (tile2long(centreTileX + 1, zoom) - centre[0]) / TILE_SIZE;
    const yScale = (tile2lat(centreTileY + 1, zoom) - centre[1]) / TILE_SIZE;

    const xDelta = x - width / 2;
    const yDelta = y - height / 2;

    return [
        centre[0] + xDelta * xScale,
        centre[1] + yDelta * yScale,
    ];
}

/**
 * Returns (x,y) co-ordinate of top left corner
 * @param {number} tileX
 * @param {number} tileY
 * @param {StaticMapContextValue} context
 */
export function tileXY2CanvasXY (tileX, tileY, { centre, zoom, width, height }) {
    const tileOffsetX = lon2tileFrac(centre[0], zoom);
    const tileOffsetY = lat2tileFrac(centre[1], zoom);

    const imageOffsetX = width / 2;
    const imageOffsetY = height / 2;

    const i = tileX - tileOffsetX;
    const j = tileY - tileOffsetY;

    const x = i * TILE_SIZE + imageOffsetX;
    const y = j * TILE_SIZE + imageOffsetY;

    return [x, y];
}

/**
 * @param {StaticMapContextValue} context
 * @returns {[number, number, number, number]} [minLon, minLat, maxLon, maxLat]
 */
export function getBounds (context) {
    const bottomLeft = xy2LonLat(0, context.height, context);
    const topRight = xy2LonLat(context.width, 0, context);

    return [bottomLeft[0], bottomLeft[1], topRight[0], topRight[1]];
}