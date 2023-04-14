import React, { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap";
import { renderPathLayer } from "../canvas-renderers/renderPathLayer";
import { useEffectDebugger } from "../hooks/useEffectDebugger";

/**
 * @typedef {{points: {lon: number;lat: number;}[];color?: ?string;lineDash?: ?number[];}} Path
 */

/**
 *
 * @param {object} props
 * @param {Path[]} props.paths
 * @returns
 */
export function PathLayer ({ paths }) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const context = useContext(StaticMapContext);

    const pxWidth = context.width * devicePixelRatio;
    const pxHeight = context.height * devicePixelRatio;

    useEffect(() => {
    // useEffectDebugger(() => {
    //     console.log("PathLayer: render");

        if (!canvasRef.current) return;

        canvasRef.current.width = pxWidth;
        canvasRef.current.height = pxHeight;

        renderPathLayer(canvasRef.current, context, paths);

    }, [context.centre[0], context.centre[1], context.zoom, pxWidth, pxHeight, paths]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
