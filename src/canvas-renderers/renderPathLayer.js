import { lonLat2XY } from "../util/projection.js";

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ centre: [number, number]; zoom: number; width: number; height: number; }} context
 * @param {import("../Layers/PathLayer.jsx").Path[]} paths
 */
export function renderPathLayer(canvas, context, paths) {
    const ctx = canvas.getContext("2d");

    if (!ctx)
        return;

    const projection = lonLat2XY(context);

    for (const path of paths) {
        ctx.strokeStyle = path.color ?? "red";

        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.beginPath();

        for (const point of path.points) {
            const [x, y] = projection(point.lon, point.lat);

            ctx.lineTo(x * devicePixelRatio, y * devicePixelRatio);
        }

        if (path.lineDash) {
            ctx.setLineDash(path.lineDash.map(v => v * devicePixelRatio));
        }
        else {
            ctx.setLineDash([]);
        }

        ctx.stroke();
    }
}
