
import { calculateGradient } from "../util/calculateGradient.js";

/** @type {OffscreenCanvas} */
export let canvas;

addEventListener("message", (ev) => {
    if (ev.data.canvas) {
        canvas = ev.data.canvas;
    }
    else {
        const { context, pxWidth, pxHeight, field, alpha, rangeLimit, scale } = ev.data;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Clear canvas quickly
        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        setTimeout(() => {
            calculateGradient(canvas, context, pxWidth, pxHeight, field, alpha, rangeLimit, scale);
        }, 0);
    }
});
