import React from "react";
import { ParticleFieldLayer } from "./ParticleFieldLayer.js";
import { useTidalCurrents } from "../hooks/useTidalCurrents.js";
import { useSeaMask } from "../hooks/useSeaMask.js";
import { useTileJSON } from "../hooks/useTileJSON.js";
import { useInitRef } from "../hooks/useInitRef.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function CurrentParticleLayer ({ time }) {
    const tideVectors = useTidalCurrents(time);

    const maskCanvasRef = useInitRef(() => document.createElement("canvas"));

    const tileLayer = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    useSeaMask(tileLayer, maskCanvasRef.current);

    return tideVectors && <ParticleFieldLayer field={tideVectors} particleFill="#00F" rangeLimit={0.5} speed={20} density={10} particleStyle="bar" mask={maskCanvasRef.current} />
}

