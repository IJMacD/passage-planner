import React, { useContext } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../util/geo.js";

export function ControlsLayer({ setCentre, setZoom }) {
  // Need zoom from context to calculate new centre
  const { zoom } = useContext(StaticMapContext);

  /**
   *
   * @param {number} dx Number of tiles to move horizontally
   * @param {number} dy Number of tiles to move vertically
   */
  function moveCentre(dx, dy) {
    setCentre((/** @type {[lon: number, lat: number]} */ centre) => {
      let [lon, lat] = centre;

      const tileX = lon2tile(lon, zoom);
      const tileY = lat2tile(lat, zoom);

      if (dx) {
        // Hack to avoid bug where clicking control doesn't actually move map
        const newLon = tile2long(tileX + dx, zoom);
        if (newLon === lon) {
          lon = tile2long(tileX + 2 * dx, zoom);
        }
        else {
          lon = newLon;
        }
      }

      if (dy) {
        // Hack to avoid bug where clicking control doesn't actually move map
        const newLat = tile2lat(tileY + dy, zoom);
        if (newLat === lat) {
          lat = tile2lat(tileY + 2 * dy, zoom);
        }
        else {
          lat = newLat;
        }
      }

      return [lon, lat];
    });
  }

  return (
    <div className="BasicMap-Controls" style={{ position: "absolute", top: 20, right: 20, textAlign: "center" }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      {setCentre &&
        <>
          <button onClick={() => moveCentre(0, -1)}>North</button><br />
          <button onClick={() => moveCentre(-1, 0)}>West</button>
          <button onClick={() => moveCentre(1, 0)}>East</button><br />
          <button onClick={() => moveCentre(0, 1)}>South</button><br />
        </>
      }
      {setZoom &&
        <>
          <button onClick={() => setZoom(z => z - 1)}>Zoom -</button>
          <button onClick={() => setZoom(z => z + 1)}>Zoom +</button>
        </>
      }
    </div>
  );
}