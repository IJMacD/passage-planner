import { useTileJSON } from "../hooks/useTileJSON.js";
import { CanvasTileLayer } from "./CanvasTileLayer.jsx";

export function HongKongMarineLayer () {
    const tileLayer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    return tileLayer ? <CanvasTileLayer layer={tileLayer} /> : null;
}