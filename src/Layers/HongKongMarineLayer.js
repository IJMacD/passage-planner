import React from "react";
import { useTileJSON } from "../hooks/useTileJSON";
import { CanvasTileLayer } from "./CanvasTileLayer";

export function HongKongMarineLayer () {
    const tileLayer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    return tileLayer ? <CanvasTileLayer layer={tileLayer} /> : null;
}