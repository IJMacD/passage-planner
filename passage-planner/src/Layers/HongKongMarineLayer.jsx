import { useTileJSON } from "../hooks/useTileJSON.js";
import { CanvasTileLayer } from "./CanvasTileLayer.jsx";

/**
 * 
 * @param {object} props
 * @param {import("react").CSSProperties|undefined} [props.style]
 * @returns 
 */
export function HongKongMarineLayer({ style }) {
    const tileLayer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    return tileLayer ? <CanvasTileLayer layer={tileLayer} style={style} /> : null;
}