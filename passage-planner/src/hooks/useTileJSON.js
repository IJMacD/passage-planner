import { useEffect, useState } from 'react';

/**
 *
 * @param {string} url
 * @returns {import('../Layers/TileMapLayer').TileJSON?}
 */
export function useTileJSON(url) {
  const [tileJSON, setTileJSON] = useState(null);

  useEffect(() => {
    if (url) {
      fetch(url).then(r => r.json()).then(setTileJSON);
    } else {
      setTileJSON(null);
    }
  }, [url]);

  return tileJSON;
}
