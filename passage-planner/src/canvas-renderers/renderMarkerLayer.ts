import { lonLat2XY } from "../util/projection";

export function renderMarkerLayer(canvas: HTMLCanvasElement, context: { height: number; width: number; centre: [number, number]; zoom: number; }, markers: { lat: number; lon: number; name: string; }[]) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context for marker layer");
        return;
    }

    const projection = lonLat2XY(context);

    markers.forEach(marker => {
        if (marker.name === "red-dot") {
            ctx.fillStyle = "red";
            const markerSize = 4; // Size of the marker in pixels
            const [x, y] = projection(marker.lon, marker.lat);
            ctx.beginPath();
            ctx.arc(x * devicePixelRatio, y * devicePixelRatio, markerSize * devicePixelRatio, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
}
