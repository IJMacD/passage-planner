import React from "react";
import { useBasemap } from "../hooks/useBasemap";
import { TileMapLayer } from "./TileMapLayer";

export function HongKongMarineLayer () {
    const basemap = useBasemap("https://ijmacd.com/tiles/hongkong-marine");

    return basemap ? <TileMapLayer layer={basemap} /> : null;
}