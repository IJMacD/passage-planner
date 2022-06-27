import { useContext, useEffect, useRef } from "react";
import { getVesselColours } from "../ais";
import { lat2tile, lon2tile, tile2lat, tile2long } from "../geo";
import { StaticMapContext } from "../StaticMap";

const TILE_SIZE = 256;

/**
 *
 * @param {object} props
 * @param {{ NAME: string, MMSI: number, LATITUDE: number, LONGITUDE: number, SOG: number, COG: nmber, NAVSTAT: number; }[]} props.vessels
 * @returns
 */
export function AISLayerCanvas ({ vessels }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement>} */
    const canvasRef = useRef(null);

    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;

        const tileWidth = TILE_SIZE * devicePixelRatio;
        const tileHeight = TILE_SIZE * devicePixelRatio;

        const tileCountX = pxWidth / tileWidth;
        const tileCountY = pxHeight / tileHeight;

        const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
        const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

        const minLon = tile2long(tileOffsetX, zoom);
        const minLat = tile2lat(tileOffsetY, zoom);
        const maxLon = tile2long(tileOffsetX + tileCountX, zoom);
        const maxLat = tile2lat(tileOffsetY + tileCountY, zoom);


        for (const vessel of vessels) {
            const lonFrac = (vessel.LONGITUDE-minLon)/(maxLon-minLon);
            const latFrac = (vessel.LATITUDE-minLat)/(maxLat-minLat);

            if (lonFrac >= 0 && lonFrac <= 1 && latFrac >= 0 && latFrac <= 1) {
                const x = lonFrac * pxWidth;
                const y = latFrac * pxHeight;

                ctx.translate(x, y);

                const [ dark, light ] = getVesselColours(vessel);

                ctx.fillStyle = dark;
                ctx.font = `${10 * devicePixelRatio}px sans-serif`;
                ctx.fillText(vessel.NAME, 5 * devicePixelRatio, 0);

                ctx.strokeStyle = dark;
                ctx.fillStyle = light;

                ctx.lineWidth = 2 * devicePixelRatio;
                ctx.beginPath();

                if (vessel.SOG === 0) {
                    ctx.arc(0, 0, 5 * devicePixelRatio, 0, Math.PI * 2);
                }
                else {
                    ctx.rotate(vessel.COG / 180 * Math.PI + Math.PI);

                    const r = 10 * devicePixelRatio;

                    ctx.moveTo(0, -r * 2);
                    ctx.lineTo(r, r);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-r, r);
                    ctx.closePath()
                    ctx.lineCap = "round";

                    ctx.resetTransform();
                }

                ctx.fill();
                ctx.stroke();



            }
        }


    }, [centre, zoom, pxWidth, pxHeight, vessels]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}
