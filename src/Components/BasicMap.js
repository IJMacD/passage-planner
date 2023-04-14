import React from "react";
import { useSavedState } from "../hooks/useSavedState";
import { ControlsLayer } from "../Layers/ControlsLayer";
import { WorldLayer } from "../Layers/WorldLayer";
import { StaticMap } from "./StaticMap";

/**
 *
 * @param {object} props
 * @param {(lon: number, lat: number, e: React.MouseEvent) => void} [props.onClick]
 * @param {React.ReactNode} [props.children]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @returns
 */
export function BasicMap ({ onClick, children, width, height }) {
    const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);

    return (
        <StaticMap centre={centre} zoom={zoom} width={width} height={height} onClick={onClick}>
            <WorldLayer />
            {/* { basemapLayer && <TileMapLayer layer={basemapLayer} /> } */}
            { children }
            <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
        </StaticMap>
    );
}