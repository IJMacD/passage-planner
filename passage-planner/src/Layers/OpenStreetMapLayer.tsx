import { CSSProperties } from "react";
import { JSX } from "react/jsx-runtime";
import { useTileJSON } from "../hooks/useTileJSON";
import { CanvasTileLayer } from "./CanvasTileLayer";

export function OpenStreetMapLayer(props: JSX.IntrinsicAttributes & { style?: CSSProperties | undefined; }) {
    const tileLayer = useTileJSON("https://raw.githubusercontent.com/mapbox/tilejson-spec/master/2.2.0/example/osm.layer");
    
        return tileLayer ? <CanvasTileLayer layer={tileLayer} {...props} /> : null;
}