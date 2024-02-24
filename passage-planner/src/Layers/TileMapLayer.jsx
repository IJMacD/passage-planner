import React, { useContext } from "react";
import { lat2tile, lon2tile } from "../util/geo.js";
import { StaticMapContext } from "../Components/StaticMapContext.js";
import { tileXY2CanvasXY } from "../util/projection.js";
import { formatTileURL } from "../util/getTiles.js";

const TILE_SIZE = 256;

/**
 * @typedef Layer
 * @prop {string} layerType "tiles",
 * @prop {string} baseURL "https://ijmacd.com/tiles/hongkong-marine",
 * @prop {string} name "2021-11",
 * @prop {string} description "",
 * @prop {string} legend "",
 * @prop {string} attribution "Rendered with <a href=\"https://www.maptiler.com/desktop/\">MapTiler Desktop</a>",
 * @prop {string} type "overlay",
 * @prop {string} version "1",
 * @prop {string} format "png",
 * @prop {string} format_arguments "",
 * @prop {string} minzoom "8",
 * @prop {string} maxzoom "16",
 * @prop {string} bounds "113.516359,22.067786,114.502779,22.568333",
 * @prop {string} scale "2.000000",
 * @prop {string} profile "mercator",
 * @prop {string} scheme "tms",
 * @prop {string} generator "MapTiler Desktop Pro 10.3-0934099ad7"
 */

/**
 * @typedef TileJSON
 * @prop {string} attribution "<a href=\"https://www.maptiler.com/copyright/\" target=\"_blank\">&copy; MapTiler</a> <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">&copy; OpenStreetMap contributors</a>",
 * @prop {string} tilejson "2.0.0",
 * @prop {string} name "Pastel",
 * @prop {number} minzoom 0,
 * @prop {number} maxzoom 22,
 * @prop {[number,number,number,number]} bounds [
        -180,
        -85.0511,
        180,
        85.0511
    ],
 * @prop {string} format "png",
 * @prop {string} type "baselayer",
 * @prop {[number,number,number]} center [
        0,
        0,
        0
    ],
 * @prop {string} color "#F2F2F2",
 * @prop {string[]} tiles [
        "https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=x0dGPmUo4q725h9LSKms"
    ],
 * @prop {string} logo "https://api.maptiler.com/resources/logo.svg"
 */


/**
 *
 * @param {object} props
 * @param {TileJSON} props.layer
 * @returns
 */

export function TileMapLayer({ layer }) {
    const context = useContext(StaticMapContext);
    const { centre, zoom, width, height } = context;

    if (zoom < +layer.minzoom || zoom > +layer.maxzoom) {
        return null;
    }

    const tileCountX = Math.ceil(width / TILE_SIZE);
    const tileCountY = Math.ceil(height / TILE_SIZE);

    const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

    console.warn("TileMapLayer not optimised for non-integer tile offsets");
    const projection = tileXY2CanvasXY(context);
    const [left, top] = projection(tileOffsetX, tileOffsetY);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top, left, lineHeight: 0, }}>
            <img src={formatTileURL(layer, zoom, tileOffsetX + 0, tileOffsetY + 0)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 1, tileOffsetY + 0)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 2, tileOffsetY + 0)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 3, tileOffsetY + 0)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 0, tileOffsetY + 1)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 1, tileOffsetY + 1)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 2, tileOffsetY + 1)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 3, tileOffsetY + 1)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 0, tileOffsetY + 2)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 1, tileOffsetY + 2)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 2, tileOffsetY + 2)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 3, tileOffsetY + 2)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 0, tileOffsetY + 3)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 1, tileOffsetY + 3)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 2, tileOffsetY + 3)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={formatTileURL(layer, zoom, tileOffsetX + 3, tileOffsetY + 3)} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
        </div>
    );
}
