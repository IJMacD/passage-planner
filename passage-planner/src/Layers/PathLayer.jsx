import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { renderPathLayer } from "../canvas-renderers/renderPathLayer.js";

/**
 * @typedef {{points: {lon: number;lat: number;}[];color?: ?string;lineDash?: ?number[];}} Path
 */

/**
 *
 * @param {object} props
 * @param {Path[]} props.paths
 * @returns
 */
export function PathLayer({ paths }) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    const context = useContext(StaticMapContext);

    const [left, top] = useContext(DragContext);

    const pxWidth = context.width * devicePixelRatio;
    const pxHeight = context.height * devicePixelRatio;

    // useEffectDebugger(() => {
    //     console.log("PathLayer: render");
    useEffect(() => {

        if (!canvasRef.current) return;

        canvasRef.current.width = pxWidth;
        canvasRef.current.height = pxHeight;

        renderPathLayer(canvasRef.current, context, paths);

    }, [context, pxWidth, pxHeight, paths]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
