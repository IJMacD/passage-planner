import { useEffect, useState } from 'react';

export function useTileMetadata(baseURL) {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (baseURL) {
      fetch(`${baseURL}/metadata.json`).then(r => r.json()).then(setMetadata);
    } else {
      setMetadata(null);
    }
  }, [baseURL]);

  return metadata;
}
