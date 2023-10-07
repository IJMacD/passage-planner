import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import React from "react";
import gradientFieldWorker from '../workers/gradientFieldWorker.js?worker'

/**
 *
 * @param {object} props
 * @param {import("./VectorFieldLayer.js").Field} props.field
 * @param {number} [props.alpha]
 * @param {number} [props.rangeLimit] In nautical miles
 * @returns {React.JSX.Element}
 */
export function GradientFieldLayer ({ field, alpha = 255, rangeLimit = 10 }) {
    const context = useContext(StaticMapContext);

    const [left,top] = useContext(DragContext);

    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    const { width, height } = useContext(StaticMapContext);

    const workerRef = useRef(/** @type {Worker?} */(null));

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    // Colour scale mapping: from min to max wind => 0 to 360 deg
    const scale = 2.5;

    useEffect(() => {
        if (!canvasRef.current) return;

        if (!workerRef.current) {
            const offscreenCanvas = canvasRef.current.transferControlToOffscreen();

            const worker = new gradientFieldWorker();

            worker.postMessage({canvas: offscreenCanvas}, [offscreenCanvas]);

            workerRef.current = worker;
        }
    }, []);

    useEffect(() => {
        if (!workerRef.current) return;

        workerRef.current.postMessage({ context, pxWidth, pxHeight, field, alpha, rangeLimit, scale });
    }, [context, pxWidth, pxHeight, field, alpha, rangeLimit, scale]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
