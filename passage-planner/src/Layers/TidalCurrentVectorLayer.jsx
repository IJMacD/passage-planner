import { useTidalCurrents } from "../hooks/useTidalCurrents";
import { VectorFieldLayer } from "./VectorFieldLayer";

export function TidalCurrentVectorLayer({ time, ...otherProps }) {
    const tideVectors = useTidalCurrents(time);
    return tideVectors && <VectorFieldLayer field={tideVectors} {...otherProps} />;
}