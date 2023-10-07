import React from "react";
import { ControlsLayer } from "../Layers/ControlsLayer.jsx";
import { WorldLayer } from "../Layers/WorldLayer.jsx";
import { StaticMap } from "./StaticMap.jsx";

/**
 *
 * @param {object} props
 * @param {[number,number]} props.centre
 * @param {number} props.zoom
 * @param {(centre: [number,number]) => void} props.setCentre
 * @param {(zoom: number) => void} props.setZoom
 * @param {(lon: number, lat: number, e: React.MouseEvent) => void} [props.onClick]
 * @param {React.ReactNode} [props.children]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {boolean} [props.draggable]
 * @returns
 */
export function BasicMap ({ centre, zoom, setCentre, setZoom, onClick, draggable = false, children, width, height }) {
    return (
        <StaticMap centre={centre} zoom={zoom} width={width} height={height} onClick={onClick} draggable={draggable}>
            <WorldLayer />
            {/* { basemapLayer && <TileMapLayer layer={basemapLayer} /> } */}
            { children }
            <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
        </StaticMap>
    );
}