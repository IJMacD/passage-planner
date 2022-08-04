import React, { useEffect, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";
import { MarkerLayer } from "../Layers/MarkerLayer";
import { PathLayer } from "../Layers/PathLayer";
import { WorldLayer } from "../Layers/WorldLayer";
import { lat2tile, latlon2bearing, latlon2nm, lon2tile, tile2lat, tile2long } from "../util/geo";
import { makeCoursePlot } from "../util/makeCoursePlot";
import { StaticMap } from "./StaticMap";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom";
// import { DebugLayer } from "../Layers/DebugLayer";
import { PolarPlotSVG } from "./PolarPlotSVG";

/**
 *
 * @param {object} props
 * @param {import("../util/gpx").Track?} props.track
 */
export function TrackDetails ({ track }) {
    const [ { centre, zoom }, setCentreAndZoom ] = useCentreAndZoom(track);
    const [ followPlayingCentre, setFollowPlayingCentre ] = useState(false);

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
        if (isPlaying && track) {
            const trackPoints = track.segments.flat();

            const id = setInterval(() => setSelectedPointIndex(index => {
                index++;
                if (index >= trackPoints.length) { index = 0; }

                if (followPlayingCentre) {
                    const { lon, lat } = trackPoints[index];
                    setCentreAndZoom(({ zoom }) => ({ centre: [lon, lat], zoom }));
                }

                return index;
            }), 500);

            return () => clearInterval(id);
        }
    }, [isPlaying, followPlayingCentre, track]);

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

    /** @type {[number, number][]} */
    const instantSpeedHeadingData = trackLegs.map(leg => [leg.heading||0, leg.distance/leg.duration]);

    const selectedLeg = trackLegs[selectedPointIndex];

    const colorFns = {
        rainbow: (_, i) => `hsl(${i % 360},100%,50%)`,
        faded: (_, i, values) => `rgba(255, 0, 0, ${i/values.length})`,
        heading: (value) => `hsl(${value[0]},100%,50%)`,
        fadedRainbow: (_, i,values) => `hsla(${i % 360},100%,50%,${i/values.length})`,
    };

    const labelFns = {
        distance: v => `${v.toFixed(1)} NM`,
        duration: v => `${(v / 3600000).toFixed(1)} hrs`,
        speed: v => `${(v * 3600000).toFixed(1)} knots`,
    };

    return (
        <div>
            <div style={{display:"flex"}}>
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
                <div>
                    <input type="range" min={0} max={trackPoints.length} value={selectedPointIndex} onChange={e => setSelectedPointIndex(e.target.valueAsNumber)} />
                    <button onClick={() => setIsPlaying(isPlaying => !isPlaying)}>{isPlaying?"Pause":"Play"}</button>
                    <label>
                        <input type="checkbox" checked={followPlayingCentre} onChange={e => setFollowPlayingCentre(e.target.checked)} />
                        Follow
                    </label>
                    <p>{selectedPoint?.time?.toLocaleString()}</p>
                </div>
                    <PolarPlotSVG values={distancePlotData} marker={selectedLeg?.heading} width={250} height={250} color="red"      labelFn={labelFns.distance} />
                    <PolarPlotSVG values={durationPlotData} marker={selectedLeg?.heading} width={250} height={250} color="blue"     labelFn={labelFns.duration} />
                    <PolarPlotSVG values={speedPlotData}    marker={selectedLeg?.heading} width={250} height={250} color="purple"   labelFn={labelFns.speed} />
                    <PolarPlotSVG values={maxSpeedPlotData} marker={selectedLeg?.heading} width={250} height={250} color="green"    labelFn={labelFns.speed} />
                    <PolarPlotSVG
                        values={instantSpeedHeadingData.slice(0, selectedPointIndex+1)}
                        marker={selectedLeg?.heading}
                        markerValue={selectedLeg?.distance/selectedLeg?.duration}
                        width={250}
                        height={250}
                        color={colorFns.faded}
                        labelFn={labelFns.speed}
                    />
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

