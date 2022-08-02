import { useMemo } from "react";
import { useSavedState } from "./useSavedState";
import { useTileMetadata } from "./useTileMetadata";

export function useBasemap (initalURL = "") {
    const [ backgroundTileURL, setBackgroundTileURL ] = useSavedState("passagePlanner.backgroundUrl", initalURL);
    const backgroundMetadata = useTileMetadata(backgroundTileURL);

    return useMemo(() => backgroundMetadata ? {
      layerType: "tiles",
      baseURL: backgroundTileURL,
      ...backgroundMetadata,
    } : null, [ backgroundMetadata, backgroundTileURL ]);
}