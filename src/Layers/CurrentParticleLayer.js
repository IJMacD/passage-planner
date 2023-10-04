import React from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.js";
import { useTides } from "../hooks/useTides.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function CurrentParticleLayer ({ time }) {
    const tideVectors = useTides(time);

    return tideVectors && <ParticleFieldLayer field={tideVectors} particleFill="#00F" rangeLimit={0.5} speed={20} density={10} particleStyle="bar" />
}
