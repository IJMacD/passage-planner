import { useTidalCurrents } from "../hooks/useTidalCurrents";
import { VectorFieldLayer } from "./VectorFieldLayer";

export function TidalCurrentVectorLayer({ time, outline = false, showMagnitude = false }) {
    const tideVectors = useTidalCurrents(time);
    return tideVectors && <VectorFieldLayer field={tideVectors} outline={outline} showMagnitude={showMagnitude} />;
}