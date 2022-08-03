import React, { useEffect, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";
import { MarkerLayer } from "../Layers/MarkerLayer";
import { PathLayer } from "../Layers/PathLayer";
import { WorldLayer } from "../Layers/WorldLayer";
import { lat2tile, latlon2bearing, latlon2nm, lon2tile, tile2lat, tile2long } from "../util/geo";
import { makeCoursePlot } from "../util/makeCoursePlot";
import { PolarPlot } from "./PolarPlot";
import { StaticMap } from "./StaticMap";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom";
import { DebugLayer } from "../Layers/DebugLayer";
import { PolarPlotSVG } from "./PolarPlotSVG";

/**
 *
 * @param {object} props
 * @param {import("../util/gpx").Track?} props.track
 */
export function TrackDetails ({ track }) {
    const [ { centre, zoom }, setCentreAndZoom ] = useCentreAndZoom(track);

    /**
     * @param {number|((oldValue: number) => number)} zoom
     */
    function setZoom (zoom) {
        if (typeof zoom === "function") {
            setCentreAndZoom(cam => ({ ...cam, zoom: zoom(cam.zoom) }));
        } else {
            setCentreAndZoom(cam => ({ ...cam, zoom }));
        }
    }

    const [ selectedPointIndex, setSelectedPointIndex ] = useState(0);
    const [ isPlaying, setIsPlaying ] = useState(false);

    useEffect(() => {
        const trackPoints = track ? track.segments.flat() : [];

        if (isPlaying && track) {
            const id = setInterval(() => setSelectedPointIndex(index => {
                index++;
                if (index >= trackPoints.length) { index = 0; }
                return index;
            }), 500);

            return () => clearInterval(id);
        }
    }, [isPlaying, track]);

    if (!track) {
        return null;
    }

    /**
     *
     * @param {number} dx Number of tiles to move horizontally
     * @param {number} dy Number of tiles to move vertically
     */
    function moveCentre (dx, dy) {
      setCentreAndZoom(({ centre, zoom }) => {
        const tileX = lon2tile(centre[0], zoom);
        const tileY = lat2tile(centre[1], zoom);

        const lon = tile2long(tileX + dx, zoom);
        const lat = tile2lat(tileY + dy, zoom);

        return { centre: [lon, lat], zoom };
      });
    }

    const trackPoints = track ? track.segments.flat() : [];

    /** @type {import("../util/gpx").Point?} */
    const selectedPoint = trackPoints[selectedPointIndex];

    const trackPath = [{ points: trackPoints }];

    const markers = selectedPoint ? [{ lon: selectedPoint.lon, lat: selectedPoint.lat, name: "red-dot" }] : [];

    // markers.push({ lon: centre[0], lat: centre[1], name: "grey-pin" });

    const trackLegs = makeTrackLegs(trackPoints);

    const plotDivisions = 16;

    const distancePlotData = makeCoursePlot(trackLegs, leg => leg.distance, plotDivisions);
    const durationPlotData = makeCoursePlot(trackLegs, leg => leg.duration, plotDivisions);
    const speedPlotData = makeCoursePlot(trackLegs, leg => leg.distance / leg.duration, plotDivisions, "average");
    const maxSpeedPlotData = makeCoursePlot(trackLegs, leg => leg.distance / leg.duration, plotDivisions, "max");

    return (
        <div style={{display:"flex"}}>
            <div>
                <p>{track.name}</p>
                <input type="range" min={0} max={trackPoints.length} value={selectedPointIndex} onChange={e => setSelectedPointIndex(e.target.valueAsNumber)} />
                <button onClick={() => setIsPlaying(isPlaying => !isPlaying)}>{isPlaying?"Pause":"Play"}</button>
                <p>{selectedPoint?.time?.toLocaleString()}</p>
            </div>
            <div>
                <StaticMap centre={centre} zoom={zoom} width={800} height={800}>
                    <WorldLayer />
                    <HongKongMarineLayer />
                    {/* <DebugLayer /> */}
                    <PathLayer paths={trackPath} />
                    <MarkerLayer markers={markers} />
                    <div className="BasicMap-Controls" style={{ position: "absolute", top: 20, right: 20 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => moveCentre(-1, 0)}>West</button>
                        <button onClick={() => moveCentre(0, -1)}>North</button>
                        <button onClick={() => moveCentre(0, 1.1)}>South</button>
                        <button onClick={() => moveCentre(1, 0)}>East</button>
                        <button onClick={() => setZoom(z => z - 1)}>Zoom -</button>
                        <button onClick={() => setZoom(z => z + 1)}>Zoom +</button>
                    </div>
                </StaticMap>
                <div>
                    <PolarPlotSVG values={distancePlotData} marker={trackLegs[selectedPointIndex]?.heading} width={200} height={200} color="red" labelFn={v => `${v.toFixed(1)} NM`} />
                    <PolarPlotSVG values={durationPlotData} marker={trackLegs[selectedPointIndex]?.heading} width={200} height={200} color="blue" labelFn={v => `${(v / 3600000).toFixed(1)} hrs`} />
                    <PolarPlotSVG values={speedPlotData} marker={trackLegs[selectedPointIndex]?.heading} width={200} height={200} color="purple" labelFn={v => `${(v * 3600000).toFixed(1)} knots`} />
                    <PolarPlotSVG values={maxSpeedPlotData} marker={trackLegs[selectedPointIndex]?.heading} width={200} height={200} color="green" labelFn={v => `${(v * 3600000).toFixed(1)} knots`} />
                </div>
            </div>
        </div>
    );
}

/**
 * @param {import("../util/gpx").Point[]} trackPoints
 */
function makeTrackLegs(trackPoints) {
    return trackPoints.map((p, i, a) => ({ from: a[i - 1], to: p })).slice(1).map(({ from, to }) => {
        const duration = +(to.time || 0) - +(from.time || 0);

        if (from.lon === to.lon && from.lat === to.lat) {
            return {
                from,
                to,
                distance: 0,
                heading: NaN,
                duration,
            };
        }

        return {
            from,
            to,
            distance: latlon2nm(from, to),
            heading: latlon2bearing(from, to),
            duration: duration
        };
    });
}

