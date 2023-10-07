import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { xy2LonLat } from "../util/projection.js";
import React from "react";
import { latlon2nm } from "../util/geo.js";
import { hsl2rgb } from "../util/colour.js";

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

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    // useEffect(() => {
    //     const workerInstance = worker;

    //     // Attach an event listener to receive calculations from your worker
    //     workerInstance.addEventListener('message', (message) => {
    //         console.log('New Message: ', message.data)
    //     });

    //     // Run your calculations
    //     workerInstance.calculatePrimes(500, 1000000000)
    // });

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });

        if (ctx) {
            ctx.canvas.width = pxWidth;
            ctx.canvas.height = pxHeight;

            const projection = xy2LonLat(context);

            const pixelData = ctx.getImageData(0, 0, pxWidth, pxHeight);

            const dpr = devicePixelRatio;

            for (let i = 0; i < pixelData.data.length; i += 4) {
                const x = (i / 4) % pxWidth;
                const y = Math.floor(i / 4 / pxWidth);

                const [ lon, lat ] = projection(x / dpr, y / dpr);

                const vector = calculateField({ lon, lat }, field, rangeLimit);

                // const rotation = Math.atan2(vector[1], vector[0]);
                const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                const scale = 5;

                const [ r, g, b ] = hsl2rgb(magnitude * scale, 1, 0.5);

                pixelData.data[i] = r;
                pixelData.data[i+1] = g;
                pixelData.data[i+2] = b;
                pixelData.data[i+3] = magnitude > 0 ? alpha : 0;
            }

            ctx.putImageData(pixelData, 0, 0);
        }


    }, [context, pxWidth, pxHeight, field, alpha, rangeLimit]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}

/**
 * @param {{ lon: number; lat: any; }} point
 * @param {import("./VectorFieldLayer.js").Field} field
 * @param {number} [rangeLimit] in nautical Miles
 */
function calculateField(point, field, rangeLimit = 10) {
    /** @type {((import("./VectorFieldLayer.js").PolarFieldPoint|import("./VectorFieldLayer.js").VectorFieldPoint)&{weight:number})[]} */
    // @ts-ignore
    const fieldPoints = field.map(fp => {
        const dist = latlon2nm(point, fp);
        // y = ((1)/(1+ℯ^(a (x - 1/2))))
        // Very cool segmented pattern
        // const a = 10
        const a = 1;
        const weight = 1 / (1 + Math.exp(a * (dist - 0.5)));
        return (dist <= rangeLimit) ? { ...fp, weight } : null;
    }).filter(fp => fp);

    const sum = fieldPoints.reduce((sum, p) => sum + p.weight, 0);

    // 2 ---> x <--------- 4
    // sum = 6
    // A: 0.66666
    // B: 0.33333
    // 1/2 + 1/4
    // 2/4 + 1/4 = 3/4
    // 2/4 / 3/4 = 0.666
    // 1/4 / 3/4 = 0.333
    /** @type {[number, number]} */
    const vector = fieldPoints.reduce((vector, p) => {
        let x;
        let y;
        if ("vector" in p) {
            [x, y] = p.vector;
        }
        else {
            x = p.magnitude * Math.sin(p.direction * Math.PI / 180);
            y = p.magnitude * -Math.cos(p.direction * Math.PI / 180);
        }
        const t = p.weight / sum;
        return [
            vector[0] + t * x,
            vector[1] + t * y,
        ];
    }, [0, 0]);

    return vector;
}
