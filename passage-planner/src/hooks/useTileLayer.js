import { useMemo } from "react";
import { useTileMetadata } from "./useTileMetadata.js";

export function useTileLayer (baseURL) {
    const backgroundMetadata = useTileMetadata(baseURL);

    return useMemo(() => backgroundMetadata ? {
      layerType: "tiles",
      baseURL,
      ...backgroundMetadata,
    } : null, [ backgroundMetadata, baseURL ]);
}