import React from "react";
import { useTidalCurrents } from "../hooks/useTidalCurrents.js";
import { useSeaMask } from "../hooks/useSeaMask.js";
import { GradientFieldLayer } from "./GradientFieldLayer.jsx";
import { DebugMaskLayer } from "./DebugMaskLayer.jsx";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function CurrentGradientLayer ({ time }) {
    const tideVectors = useTidalCurrents(time);

    const maskCanvas = useSeaMask();

    // return <DebugMaskLayer mask={maskCanvas} />;

    return <GradientFieldLayer field={tideVectors} alpha={128} rangeLimit={1} scale={500} mask={maskCanvas} />
}

