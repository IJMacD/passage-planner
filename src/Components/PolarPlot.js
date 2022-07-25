import React from "react";
import { useEffect, useRef } from "react";

/**
 * @param {object} props
 * @param {[number, number][]} props.values [theta in degrees, radius]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {number} [props.marker] Degrees
 */
export function PolarPlot ({ values, width = 512, height = 512, marker = NaN }) {
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");

            if (ctx) {

                const canvasWidth = width * devicePixelRatio;
                const canvasHeight = height * devicePixelRatio;

                const demiWidth = canvasWidth / 2;
                const demiHeight = canvasHeight / 2;

                /**
                 * @param {number} theta Degrees
                 * @param {number} radius
                 */
                function polar2xy (theta, radius) {
                    const x = demiWidth + radius * Math.sin(theta/180*Math.PI);
                    const y = demiHeight - radius * Math.cos(theta/180*Math.PI);
                    return [x, y];
                }

                ctx.canvas.width = canvasWidth;
                ctx.canvas.height = canvasHeight;

                const radius = Math.min(demiWidth, demiHeight);

                ctx.beginPath();

                ctx.arc(demiWidth, demiHeight, radius, 0, Math.PI * 2);
                ctx.arc(demiWidth, demiHeight, radius / 2, 0, Math.PI * 2);

                for (let th = 0; th < 360; th += 45) {
                    ctx.moveTo(demiWidth, demiHeight);
                    const [x, y] = polar2xy(th, radius);
                    ctx.lineTo(x, y);
                }

                ctx.strokeStyle = "#999";
                ctx.lineWidth = 0.5 * devicePixelRatio;
                ctx.stroke();

                const maxVal = Math.max(...values.map(v => v[1]));
                const radialScale = radius / maxVal;

                ctx.beginPath()
                for (let i = 0; i < values.length; i++) {
                    const [x, y] = polar2xy(values[i][0], values[i][1] * radialScale);
                    ctx.lineTo(x, y);
                }
                ctx.closePath();

                ctx.strokeStyle = "#F00";
                ctx.lineWidth = 1 * devicePixelRatio;
                ctx.stroke();

                if (!isNaN(marker)) {
                    ctx.beginPath();
                    ctx.moveTo(demiWidth, demiHeight);
                    const [x, y] = polar2xy(marker, radius);
                    ctx.lineTo(x, y);

                    ctx.strokeStyle = "#F80";
                    ctx.lineWidth = 2 * devicePixelRatio;
                    ctx.lineCap = "round";
                    ctx.stroke();
                }
            }
        }
    }, [values, width, height, marker]);

    return <canvas ref={canvasRef} style={{width,height}} />
}