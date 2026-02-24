import { Path } from "./Layers/PathLayer";
import { TileJSON } from "./Layers/TileMapLayer";


export type TileLayer = { type: "tile"; tileJSON: TileJSON; };
export type PathLayer = { type: "path"; paths: Path[]; };
export type MarkerLayer = { type: "marker"; markers: { lat: number; lon: number; name: string; }[]; };
export type Layer = TileLayer | PathLayer | MarkerLayer;
