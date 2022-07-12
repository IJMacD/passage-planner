import React from "react";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo";

export const StaticMapContext = React.createContext({
    centre: [0, 0],
    zoom: 8,
    width: 1024,
    height: 1024,
});

const TILE_SIZE = 256;

export function StaticMap ({ centre, zoom, onClick, children }) {
    const width = 1024;
    const height = 1024;

    /**
     * @param {import("react").MouseEvent<HTMLDivElement>} e
     */
    function handleClick (e) {
        if(onClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const tileCountX = width / TILE_SIZE;
            const tileCountY = height / TILE_SIZE;

            const leftTile = lon2tile(centre[0], zoom) - tileCountX / 2;
            const topTile = lat2tile(centre[1], zoom) - tileCountY / 2;
            const rightTile = leftTile + tileCountX;
            const bottomTile = topTile + tileCountY;

            const minLon = tile2long(leftTile, zoom);
            const minLat = tile2lat(topTile, zoom);
            const maxLon = tile2long(rightTile, zoom);
            const maxLat = tile2lat(bottomTile, zoom);

            onClick(minLon + x * (maxLon - minLon), minLat + y * (maxLat - minLat));
        }
    }

    return (
        <div style={{ position: "relative", width, height, minWidth: width }} onClick={handleClick}>
            <StaticMapContext.Provider value={{ centre, zoom, width, height }}>
                { children }
            </StaticMapContext.Provider>
        </div>
    );
}