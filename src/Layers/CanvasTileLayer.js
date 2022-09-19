import React, { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap";
import { tileXY2CanvasXY } from "../util/projection";
import { useTiles } from "../hooks/useTiles";
import { loadImage } from "../util/loadImage";

const TILE_SIZE = 256;
const DEBUG = false;

/**
 *
 * @param {object} props
 * @param {import("./TileMapLayer").TileJSON} props.layer
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
