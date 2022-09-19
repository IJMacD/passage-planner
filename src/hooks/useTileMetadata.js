import { useEffect, useState } from 'react';

/**
 *
 * @param {string} baseURL
 * @returns {object}
 */
export function useTileMetadata(baseURL) {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (baseURL) {
      fetch(`${baseURL}/manifest.json`).then(r => r.json()).then(setMetadata);
    } else {
      setMetadata(null);
    }
  }, [baseURL]);

  return metadata;
}
