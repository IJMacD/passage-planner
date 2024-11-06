import { useContext, useRef } from "react";
import { DragContext } from "../Components/StaticMap.jsx";
import { useLandMask } from "../hooks/useLandMask.js";

/**
 *
 * @param {object} props
 * @param {import("./TileMapLayer.js").TileJSON} props.layer
 * @returns
 */
export function CanvasMaskTileLayer ({ layer }) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    useLandMask(layer, canvasRef.current);

    const [left,top] = useContext(DragContext);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}
