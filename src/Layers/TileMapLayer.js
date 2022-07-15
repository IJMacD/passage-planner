import { useContext } from "react";
import { lat2tile, lon2tile } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";

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
 *
 * @param {object} props
 * @param {Layer} props.layer
 * @returns
 */

export function TileMapLayer ({ layer }) {
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    if (zoom < +layer.minzoom || zoom > +layer.maxzoom) {
        return null;
    }

    const tileCountX = Math.ceil(width / TILE_SIZE);
    const tileCountY = Math.ceil(height / TILE_SIZE);

    const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
        </div>
    );
}
