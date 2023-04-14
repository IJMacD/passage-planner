import React from "react";
import { useTileJSON } from "../hooks/useTileJSON.js";
import { CanvasTileLayer } from "./CanvasTileLayer.js";

export function HongKongMarineLayer () {
    const tileLayer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    return tileLayer ? <CanvasTileLayer layer={tileLayer} /> : null;
}