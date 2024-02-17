import { xy2LonLat } from "./projection.js";
import { latlon2nm } from "./geo.js";
import { hsl2rgb } from "./colour.js";

/**
//  * @param // {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {import("../Components/StaticMapContext.js").StaticMapContextValue} context
 * @param {number} pxWidth
 * @param {number} pxHeight
 * @param {import("../Layers/VectorFieldLayer.jsx").Field} field
 * @param {number} alpha
 * @param {number} rangeLimit
 * @param {number} scale
 */
export function calculateGradient(ctx, context, pxWidth, pxHeight, field, alpha, rangeLimit, scale) {
    if (!ctx) return;

    const downscale = 10;

    const w = Math.ceil(pxWidth / downscale);
    const h = Math.ceil(pxHeight / downscale);

    const projection = xy2LonLat(context);

    // const canvas2 = new OffscreenCanvas(w, h);
    const canvas2 = document.createElement("canvas");
    canvas2.width = w;
    canvas2.height = h;

    const ctx2 = canvas2.getContext("2d", { willReadFrequently: true });

    if (!ctx2) return;

    const pixelData = ctx2.getImageData(0, 0, w, h);

    for (let i = 0; i < pixelData.data.length; i += 4) {
        const x = (i / 4) % w;
        const y = Math.floor(i / 4 / w);

        const _x = x / w * context.width;
        const _y = y / h * context.height;

        const [lon, lat] = projection(_x, _y);

        const vector = calculateField({ lon, lat }, field, rangeLimit);

        // const rotation = Math.atan2(vector[1], vector[0]);
        const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

        const [r, g, b] = hsl2rgb(magnitude * scale, 1, 0.5);

        pixelData.data[i] = r;
        pixelData.data[i + 1] = g;
        pixelData.data[i + 2] = b;
        pixelData.data[i + 3] = magnitude > 0 ? alpha : 0;
    }

    ctx2.putImageData(pixelData, 0, 0);

    ctx.drawImage(canvas2, 0, 0, w, h, 0, 0, pxWidth, pxHeight);
}

/**
 * @param {{ lon: number; lat: any; }} point
 * @param {import("../Layers/VectorFieldLayer.jsx").Field} field
 * @param {number} [rangeLimit] in nautical Miles
 */
function calculateField(point, field, rangeLimit = 10) {
    /** @type {((import("../Layers/VectorFieldLayer.jsx").PolarFieldPoint|import("../Layers/VectorFieldLayer.jsx").VectorFieldPoint)&{weight:number})[]} */
    // @ts-ignore
    const fieldPoints = field.map(fp => {
        const dist = latlon2nm(point, fp);
        // y = ((1)/(1+ℯ^(a (x - 1/2))))

        // Currents: range = 1; a = 10;      a = m/r    10 = m / 1
        // weather: range = 1000+; a = 1;    a = m/r     1 = m / 1000

        const a = 10 - 2 * Math.log(rangeLimit);//100/rangeLimit;
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
