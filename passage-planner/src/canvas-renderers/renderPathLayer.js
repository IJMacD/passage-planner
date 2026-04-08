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

    if (context.zoom >= 15) {
        // Draw points at high zoom levels
        const pointSize = context.zoom >= 18 ? 5 * devicePixelRatio : 3 * devicePixelRatio;

        for (const path of paths) {
            ctx.fillStyle = path.color ?? "red";

            for (const point of path.points) {
                const [x, y] = projection(point.lon, point.lat);

                ctx.beginPath();
                ctx.arc(x * devicePixelRatio, y * devicePixelRatio, pointSize, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }
}
