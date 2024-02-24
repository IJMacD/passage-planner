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

  function setData (i, tileJSON) {
    setTileJSONList(prevList => {
      const newList = [...prevList];
      newList[i] = tileJSON;
      return newList;
    });
  };

  useEffect(() => {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      fetch(url).then(r => r.json()).then(data => setData(i, data))
      .catch(e => {
        if (url.endsWith(".json")) {
          console.log(`Unable to load tiles at url: ${url}`);
        }
        else {
          const newURL = `${url}/tiles.json`.replace(/\/\//g, "/");
          console.log(`Unable to load tiles at url: ${url}. Trying: ${newURL}`);

          fetch(newURL).then(r => r.json()).then(data => setData(i, data))
          .catch(e => {
              console.log(`Unable to load tiles at url: ${newURL}`);
          });
        }
      });
    }
  }, [urls]);

  return tileJSONList;
}
