import React, { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap";
import { tileXY2CanvasXY } from "../util/projection";
import { useTiles } from "../hooks/useTiles";
import { loadImage } from "../util/loadImage";

export const TILE_SIZE = 256;
const DEBUG = false;

/**
 * @typedef Layer
 * @prop {string} layerType "tiles",
 * @prop {string} baseURL "https://ijmacd.com/tiles/hongkong-marine",
 * @prop {string} name "2021-11",
 * @prop {string} description "",
 * @prop {string} legend "",
 * @prop {string} attribution "Rendered with <a href=\"https://www.maptiler.com/desktop/\">MapTiler Desktop</a>",
 * @prop {string} type "overlay",
 * @prop {string} version "1",
 * @prop {string} format "png",
 * @prop {string} format_arguments "",
 * @prop {string} minzoom "8",
 * @prop {string} maxzoom "16",
 * @prop {string} bounds "113.516359,22.067786,114.502779,22.568333",
 * @prop {string} scale "2.000000",
 * @prop {string} profile "mercator",
 * @prop {string} scheme "tms",
 * @prop {string} generator "MapTiler Desktop Pro 10.3-0934099ad7"
 */

/**
 *
 * @param {object} props
 * @param {Layer} props.layer
 * @returns
 */

export function CanvasTileLayerSlippy ({ layer }) {
    const context = useContext(StaticMapContext);
    const canvasRef = useRef(/** @type {HTMLCanvasElement?} */(null));

    let { centre, zoom, width, height } = context;

    let overscale = 1;

    if (zoom < +layer.minzoom) {
        overscale = 1 / Math.pow(2, +layer.minzoom - zoom);
        zoom = +layer.minzoom;
    }
    else if (zoom > +layer.maxzoom) {
        overscale = Math.pow(2, zoom - +layer.maxzoom);
        zoom = +layer.maxzoom;
    }

    const tiles = useTiles(centre, zoom, width / overscale, height / overscale, layer);

    const projection = tileXY2CanvasXY(context);
    const topLeft = tiles[0];

    useEffect(() => {
        let current = true;

        if (canvasRef.current) {

            const ctx = canvasRef.current.getContext("2d");

            if (ctx) {
                const tileCountX = Math.ceil(width * devicePixelRatio / TILE_SIZE) + 2;
                const tileCountY = Math.ceil(height * devicePixelRatio / TILE_SIZE) + 2;

                const dpr = 1; //devicePixelRatio;
                const deviceTileSize = TILE_SIZE * dpr;

                canvasRef.current.width = tileCountX * deviceTileSize;
                canvasRef.current.height = tileCountY * deviceTileSize;


                Promise.all(tiles.map(tile => loadImage(tile.url).catch(()=>null))).then(images => {

                    if (current && canvasRef.current) {
                        console.log("Draw @ " + new Date().toISOString());

                        for (let i = 0; i < tiles.length; i++) {
                            const tile = tiles[i];
                            const img = images[i];

                            if (!img) continue;

                            ctx.drawImage(img,
                                (tile.x - topLeft.x) * deviceTileSize,
                                (tile.y - topLeft.y) * deviceTileSize,
                                deviceTileSize * overscale,
                                deviceTileSize * overscale
                            );

                            if (DEBUG) {
                                ctx.lineWidth = 3;
                                ctx.strokeStyle = "#F00";
                                ctx.strokeRect(
                                    (tile.x - topLeft.x) * deviceTileSize,
                                    (tile.y - topLeft.y) * deviceTileSize,
                                    deviceTileSize * overscale,
                                    deviceTileSize * overscale
                                );
                            }
                        }
                    }
                });
            }
        }

        return () => { current = false; };
    }, [tiles, overscale, width, height, topLeft.x, topLeft.y]);

    const [left, top] = projection(topLeft.x * overscale, topLeft.y * overscale);

    return (
        <div style={{position: "relative", width, height, overflow: "hidden"}}>
            <canvas ref={canvasRef} style={{ position: "absolute", left: left, top: top }} />;
        </div>
    );
}
