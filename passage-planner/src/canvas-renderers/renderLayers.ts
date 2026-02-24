import { Layer, TileLayer, PathLayer, MarkerLayer } from "../Layers";
import { renderMarkerLayer } from "./renderMarkerLayer";
import { renderPathLayer } from "./renderPathLayer";
import { renderTileLayer } from "./renderTileLayer";

export async function renderLayers(canvas: HTMLCanvasElement, context: { height: number; width: number; centre: [number, number]; zoom: number; }, layers: Layer[]) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === "tile") {
            const layer = layers[i] as TileLayer;
            await renderTileLayer(canvas, context, layer.tileJSON);
        }
        else if (layers[i].type === "path") {
            renderPathLayer(canvas, context, (layers[i] as PathLayer).paths);
        }
        else if (layers[i].type === "marker") {
            renderMarkerLayer(canvas, context, (layers[i] as MarkerLayer).markers);
        }
    }
}
