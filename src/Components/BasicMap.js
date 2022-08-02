import React from "react";
import { useBasemap } from "../hooks/useBasemap";
import { useSavedState } from "../hooks/useSavedState";
import { TileMapLayer } from "../Layers/TileMapLayer";
import { WorldLayer } from "../Layers/WorldLayer";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo";
import { StaticMap } from "./StaticMap";

/**
 *
 * @param {object} props
 * @param {(lon: number, lat: number, e: React.MouseEvent) => void} [props.onClick]
 * @param {JSX.Element|(React.ReactChild|false)[]} [props.children]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @returns
 */
export function BasicMap ({ onClick, children, width, height }) {

    const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);

    const basemapLayer = useBasemap();

    /**
     *
     * @param {number} dx Number of tiles to move horizontally
     * @param {number} dy Number of tiles to move vertically
     */
    function moveCentre (dx, dy) {
      setCentre(centre => {
        const tileX = lon2tile(centre[0], zoom);
        const tileY = lat2tile(centre[1], zoom);

        const lon = tile2long(tileX + dx, zoom);
        const lat = tile2lat(tileY + dy, zoom);

        return [lon, lat];
      });
    }

    return (
        <StaticMap centre={centre} zoom={zoom} width={width} height={height} onClick={onClick}>
            <WorldLayer />
            { basemapLayer && <TileMapLayer layer={basemapLayer} /> }
            { children }
            <div className="BasicMap-Controls" style={{ position: "absolute", top: 20, right: 20 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => moveCentre(-1, 0)}>West</button>
                <button onClick={() => moveCentre(0, -1)}>North</button>
                <button onClick={() => moveCentre(0, 1.1)}>South</button>
                <button onClick={() => moveCentre(1, 0)}>East</button>
                <button onClick={() => setZoom(z => z - 1)}>Zoom -</button>
                <button onClick={() => setZoom(z => z + 1)}>Zoom +</button>
            </div>
        </StaticMap>
    );
}