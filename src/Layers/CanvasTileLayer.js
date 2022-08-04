import React, { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap";
import { tileXY2CanvasXY } from "../util/projection";
import { useTiles } from "../hooks/useTiles";
import { loadImage } from "../util/loadImage";

const TILE_SIZE = 256;
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

export function CanvasTileLayer ({ layer }) {
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

    useEffect(() => {
        let current = true;

        if (canvasRef.current) {

            const ctx = canvasRef.current.getContext("2d");

            const projection = tileXY2CanvasXY(context);

            if (ctx) {

                Promise.all(tiles.map(tile => loadImage(tile.url).catch(()=>null))).then(images => {

                    if (current && canvasRef.current) {
                        canvasRef.current.width = context.width * devicePixelRatio;
                        canvasRef.current.height = context.height * devicePixelRatio;

                        for (let i = 0; i < tiles.length; i++) {
                            const tile = tiles[i];
                            const img = images[i];

                            if (!img) continue;

                            const [x, y] = projection(tile.x * overscale, tile.y * overscale);

                            ctx.drawImage(img,
                                x * devicePixelRatio,
                                y * devicePixelRatio,
                                TILE_SIZE * devicePixelRatio * overscale,
                                TILE_SIZE * devicePixelRatio * overscale
                            );

                            if (DEBUG) {
                                ctx.lineWidth = 3;
                                ctx.strokeStyle = "#F00";
                                ctx.strokeRect(
                                    x * devicePixelRatio,
                                    y * devicePixelRatio,
                                    TILE_SIZE * devicePixelRatio * overscale,
                                    TILE_SIZE * devicePixelRatio * overscale
                                );
                            }
                        }
                    }
                });
            }
        }

        return () => { current = false; };
    }, [tiles, overscale, context]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
