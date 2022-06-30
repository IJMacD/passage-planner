import { useContext } from "react";
import { lat2tile, lat2tileFrac, lon2tile, lon2tileFrac } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";
import { Marker } from "../Components/Marker";

const TILE_SIZE = 256;

export function MarkerLayer ({ markers }) {
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const tileCountX = width / TILE_SIZE;
    const tileCountY = height / TILE_SIZE;

    const minTileX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const minTileY = lat2tile(centre[1], zoom) - tileCountY / 2;
    const maxTileX = minTileX + tileCountX;
    const maxTileY = minTileY + tileCountY;

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            {
                markers.map((marker, i) => {
                    const tileX = lon2tileFrac(marker.lon, zoom);
                    const tileY = lat2tileFrac(marker.lat, zoom);

                    if (tileX < minTileX || tileX > maxTileX || tileY < minTileY || tileY > maxTileY) {
                        return null;
                    }

                    const x = (tileX - minTileX) / tileCountX * width;
                    const y  = (tileY - minTileY) / tileCountY * height;

                    return <Marker key={i} name={marker.name??"green"} x={x} y={y} />;
                })
            }
        </div>
    );
}
