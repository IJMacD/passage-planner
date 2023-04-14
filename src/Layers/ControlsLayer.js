import React, { useContext } from "react";
import { StaticMapContext } from "../Components/StaticMap.js";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo.js";

export function ControlsLayer ({ setCentre, setZoom }) {
    // Need zoom from context to calculate new centre
    const { zoom } = useContext(StaticMapContext);

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
        <div className="BasicMap-Controls" style={{ position: "absolute", top: 20, right: 20, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            { setCentre &&
                <>
                    <button onClick={() => moveCentre(0, -1)}>North</button><br/>
                    <button onClick={() => moveCentre(-1, 0)}>West</button>
                    <button onClick={() => moveCentre(1, 0)}>East</button><br/>
                    <button onClick={() => moveCentre(0, 1.1)}>South</button><br/>
                </>
            }
            { setZoom &&
              <>
                <button onClick={() => setZoom(z => z - 1)}>Zoom -</button>
                <button onClick={() => setZoom(z => z + 1)}>Zoom +</button>
              </>
            }
        </div>
    );
}