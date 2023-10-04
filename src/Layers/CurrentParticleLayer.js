import React from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.js";
import { useTidalCurrents } from "../hooks/useTidalCurrents.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function CurrentParticleLayer ({ time }) {
    const tideVectors = useTidalCurrents(time);

    return tideVectors && <ParticleFieldLayer field={tideVectors} particleFill="#00F" rangeLimit={0.5} speed={20} density={10} particleStyle="bar" />
}
