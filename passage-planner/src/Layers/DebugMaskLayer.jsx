import React, { useContext, useEffect } from "react"
import { useRef } from "react"
import { DragContext } from "../Components/StaticMapContext";

/**
 *
 * @param {object} props
 * @param {HTMLCanvasElement?} props.mask
 * @returns
 */
export function DebugMaskLayer ({ mask }) {
    const [left,top] = useContext(DragContext);

    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    const pxWidth = mask?.width || 0;
    const pxHeight = mask?.height || 0;

    useEffect(() => {
        if (!canvasRef.current) return;

        if (mask) {
            canvasRef.current.width = mask.width;
            canvasRef.current.height = mask.height;

            const ctx = canvasRef.current.getContext("2d");

            if (!ctx) return;

            ctx.drawImage(mask, 0, 0);
        }
    }, [mask])

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}