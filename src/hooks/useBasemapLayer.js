import { useMemo } from "react";
import { useSavedState } from "./useSavedState";
import { useTileMetadata } from "./useTileMetadata";

export function useBasemapLayer () {
    const [ backgroundTileURL, setBackgroundTileURL ] = useSavedState("passagePlanner.backgroundUrl", "");
    const backgroundMetadata = useTileMetadata(backgroundTileURL);

    return useMemo(() => backgroundMetadata ? {
      layerType: "tiles",
      baseURL: backgroundTileURL,
      ...backgroundMetadata,
    } : null, [ backgroundMetadata, backgroundTileURL ]);
}