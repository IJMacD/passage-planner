import React from "react";
import { useBasemap } from "../hooks/useBasemap";
import { CanvasTileLayer } from "./CanvasTileLayer";

export function HongKongMarineLayer () {
    const basemap = useBasemap("https://ijmacd.com/tiles/hongkong-marine");

    return basemap ? <CanvasTileLayer layer={basemap} /> : null;
}