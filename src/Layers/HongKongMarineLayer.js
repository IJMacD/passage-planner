import React from "react";
import { useBasemap } from "../hooks/useBasemap";
import { CanvasTileLayerSlippy } from "./CanvasTileLayerSlippy";

export function HongKongMarineLayer () {
    const basemap = useBasemap("https://ijmacd.com/tiles/hongkong-marine");

    return basemap ? <CanvasTileLayerSlippy layer={basemap} /> : null;
}