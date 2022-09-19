import { useEffect, useState } from 'react';

/**
 * @typedef {import('../Layers/TileMapLayer').TileJSON} TileJSON
 */

/**
 *
 * @param {string[]} urls
 * @returns {TileJSON[]}
 */
export function useTileJSONList(urls) {
  const [tileJSONList, setTileJSONList] = useState(/** @type {TileJSON[]} */([]));

  useEffect(() => {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      fetch(url).then(r => r.json()).then(tileJSON => {
        setTileJSONList(prevList => {
          const newList = [...prevList];
          newList[i] = tileJSON;
          return newList;
        });
      });
    }
  }, [urls]);

  return tileJSONList;
}
