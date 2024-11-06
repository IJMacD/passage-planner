import { ParticleFieldLayer } from "./ParticleFieldLayer.jsx";
import { useTidalCurrents } from "../hooks/useTidalCurrents.js";
import { useSeaMask } from "../hooks/useSeaMask.js";
/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function CurrentParticleLayer ({ time }) {
    const tideVectors = useTidalCurrents(time);

    const seaMask = useSeaMask();

    return <ParticleFieldLayer field={tideVectors} particleFill="#00F" rangeLimit={0.5} speed={20} density={10} particleStyle="bar" mask={seaMask} />
}

