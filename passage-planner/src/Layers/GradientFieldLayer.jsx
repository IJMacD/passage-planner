import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import React from "react";
import { calculateGradient } from "../util/calculateGradient.js";

/**
 *
 * @param {object} props
 * @param {import("./VectorFieldLayer.js").Field} props.field
 * @param {number} [props.alpha]
 * @param {number} [props.rangeLimit] In nautical miles
 * @param {number} [props.scale] Colour scale mapping: from min to max wind => 0 to 360 deg
 * @param {HTMLCanvasElement|null|undefined} [props.mask]
 * @returns {React.JSX.Element}
 */
export function GradientFieldLayer({
    field,
    alpha = 255,
    rangeLimit = 10,
    scale = 2.5,
    mask = undefined,
}) {
    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    const { width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        canvasRef.current.width = pxWidth;
        canvasRef.current.height = pxHeight;

        if (mask === null) {
            // mask !== undefined
            // mask is specified but not ready
            return;
        }

        const ctx = canvasRef.current.getContext("2d");

        if (ctx) {
            calculateGradient(ctx, context, pxWidth, pxHeight, field, alpha, rangeLimit, scale);

            if (mask) {
                ctx.globalCompositeOperation = "destination-in";
                ctx.drawImage(mask, 0, 0);
            }
        }
    }, [context, pxWidth, pxHeight, field, alpha, rangeLimit, scale, mask]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
