import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { lat2tile, lon2tile } from "../util/geo";
import { StaticMapContext } from "../Components/StaticMap";
import { tileXY2CanvasXY } from "../util/projection";

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
                        canvasRef.current.width = width * devicePixelRatio;
                        canvasRef.current.height = height * devicePixelRatio;

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
    }, [tiles, overscale]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}

function useImageUrls (centre, zoom, width, height, layer) {
    return useMemo(() => {
        if (zoom < +layer.minzoom || zoom > +layer.maxzoom) {
            return [];
        }

        const tileCountX = Math.ceil(width / TILE_SIZE);
        const tileCountY = Math.ceil(height / TILE_SIZE);

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        const imageURLs = [];
        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                imageURLs.push(`${layer.baseURL}/${zoom}/${tileOffsetX + i}/${tileOffsetY + j}.png`);
            }
        }

        return imageURLs;

    }, [centre, zoom, width, height, layer]);
}

/**
 * @param {[number, number]} centre
 * @param {number} zoom
 * @param {number} width
 * @param {number} height
 * @param {Layer} layer
 */
function useTiles (centre, zoom, width, height, layer) {
    return useMemo(() => {
        if (zoom < +layer.minzoom || zoom > +layer.maxzoom) {
            return [];
        }

        const tileCountX = Math.ceil(width / TILE_SIZE) + 2;
        const tileCountY = Math.ceil(height / TILE_SIZE) + 2;

        const tileOffsetX = lon2tile(centre[0], zoom) - Math.floor(tileCountX / 2);
        const tileOffsetY = lat2tile(centre[1], zoom) - Math.floor(tileCountY / 2);

        const layerBounds = layer.bounds.split(",");
        const layerMinX = lon2tile(+layerBounds[0], zoom);
        const layerMinY = lat2tile(+layerBounds[3], zoom);
        const layerMaxX = lon2tile(+layerBounds[2], zoom);
        const layerMaxY = lat2tile(+layerBounds[1], zoom);

        const tiles = [];
        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                const x = tileOffsetX + i;
                const y = tileOffsetY + j;

                if (x >= layerMinX && x <= layerMaxX && y >= layerMinY && y <= layerMaxY) {
                    const url = `${layer.baseURL}/${zoom}/${x}/${y}.png`;
                    tiles.push({ x, y, url });
                }
            }
        }

        return tiles;

    }, [centre, zoom, width, height, layer]);
}

function useImageTiles (centre, zoom, width, height, layer) {
    const [ loadedTiles, setLoadedTiles ] = useState(/** @type {{ image: ImageBitmap, x: number, y: number}[]} */([]));

    useEffect(() => {
        setLoadedTiles([]);

        if (zoom < +layer.minzoom || zoom > +layer.maxzoom) {
            return;
        }

        const tileCountX = Math.ceil(width / TILE_SIZE);
        const tileCountY = Math.ceil(height / TILE_SIZE);

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        for (let i = 0; i < tileCountX; i++) {
            for (let j = 0; j < tileCountY; j++) {
                const x = tileOffsetX + i;
                const y = tileOffsetY + j;
                const url = `${layer.baseURL}/${zoom}/${x}/${y}.png`;
                loadImage(url).then(image => {
                    setLoadedTiles(tiles => [ ...tiles, { image, x, y }]);
                });
            }
        }

    }, [centre, zoom, width, height, layer]);

    return loadedTiles;
}

/**
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage (src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(Error(`Unable to load ${src}`));
    });
}