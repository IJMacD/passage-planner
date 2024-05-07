import React, { useEffect, useMemo, useRef, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer.jsx";
import { MarkerLayer } from "../Layers/MarkerLayer.jsx";
import { PathLayer } from "../Layers/PathLayer.jsx";
import { WorldLayer } from "../Layers/WorldLayer.jsx";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import { makeCoursePlot } from "../util/makeCoursePlot.js";
import { StaticMap } from "./StaticMap.jsx";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom.js";
// import { DebugLayer } from "../Layers/DebugLayer.js";
import { PolarPlotSVG } from "./PolarPlotSVG.jsx";
import { ControlsLayer } from "../Layers/ControlsLayer.jsx";

import "./TrackDetails.css";
import { VectorFieldLayer } from "../Layers/VectorFieldLayer.jsx";
import { useTidalCurrents } from "../hooks/useTidalCurrents.js";
import { findNearestAutomaticWeatherStation } from "../util/historicalWeather.js";
import { useHistoricalWeather } from "../hooks/useHistoricalWeather.js";

const colorFns = {
    rainbow: (_, i) => `hsl(${i % 360},100%,50%)`,
    faded: (_, i, values) => `rgba(255, 0, 0, ${i / values.length})`,
    heading: (value) => `hsl(${value[0]},100%,50%)`,
    fadedRainbow: (_, i, values) => `hsla(${i % 360},100%,50%,${i / values.length})`,
    rainbowWithOpacity: opacity => (_, i) => `hsla(${i % 360},100%,50%,${opacity})`,
};

const labelFns = {
    distance: v => `${v.toFixed(1)} NM`,
    duration: v => `${(v / 3600000).toFixed(1)} hrs`,
    speed: v => `${(v * 3600000).toFixed(1)} knots`,
};

const playSpeed = 60; // 1 minute per second

/**
 *
 * @param {object} props
 * @param {import("../util/gpx.js").Track} props.track
 * @param {import("../util/gpx.js").Track[]} [props.additionalTracks]
 */
export function TrackDetails({ track, additionalTracks }) {
    const { centre: initialCentre, zoom: initialZoom } = useCentreAndZoom(track);
    const [centre, setCentre] = useState(initialCentre);
    const [zoom, setZoom] = useState(initialZoom);
    const [selectedTime, setSelectedTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [followPlayingCentre, setFollowPlayingCentre] = useState(false);
    /** @type {import("react").MutableRefObject<HTMLDivElement?>} */
    const containerRef = useRef(null)

    // const [ startPlaceName, setStartPlaceName ] = useState("");
    // const [ endPlaceName, setEndPlaceName ] = useState("");

    const trackPoints = track.segments.flat();
    const startTime = +(trackPoints[0]?.time || 0);
    const trackLength = +(trackPoints[trackPoints.length - 1]?.time || 0) - startTime;

    const selectedPoint = interpolatePoint(trackPoints, startTime + selectedTime);
    const selectedDate = new Date(selectedPoint?.time || Date.now());

    const nearestWeatherStation = selectedPoint ? findNearestAutomaticWeatherStation(selectedPoint.lon, selectedPoint.lat) : "";

    // If track changes then recentre
    useEffect(() => {
        if (initialCentre[0] === 0 && initialCentre[1] === 0) {
            return;
        }

        setCentre(initialCentre);
        setZoom(initialZoom);
    }, [initialCentre, initialZoom]);

    // Playback
    useEffect(() => {
        if (isPlaying && track) {
            const trackPoints = track ? track.segments.flat() : [];

            const refreshInterval = 100;

            const id = setInterval(() => setSelectedTime(time => {
                time += playSpeed * refreshInterval;

                if (time > trackLength) { time = 0; }

                if (followPlayingCentre) {
                    const { lon, lat } = interpolatePoint(trackPoints, startTime + time);
                    setCentre([lon, lat]);
                }

                return time;
            }), refreshInterval);

            return () => clearInterval(id);
        }
    }, [isPlaying, followPlayingCentre, track, setCentre, startTime, trackLength]);

    // useEffect(() => {
    //     const trackPoints = track ? track.segments.flat() : [];

    //     if (trackPoints.length < 1) {
    //         return
    //     }

    //     const startPoint = trackPoints[0];
    //     const endPoint = trackPoints[trackPoints.length - 1];

    //     getPlaceName(startPoint).then(setStartPlaceName);

    //     getPlaceName(endPoint).then(setEndPlaceName);

    // }, [track]);

    const tideVectors = useTidalCurrents(selectedDate);

    const paths = useMemo(() => {
        /** @type {import("../Layers/PathLayer.jsx").Path[]} */
        const paths = additionalTracks?.map(t => ({ points: t.segments.flat(), color: "orange", lineDash: [4, 4] })) || [];

        const trackPoints = track ? track.segments.flat() : [];
        paths.push({ points: trackPoints });

        return paths;
    }, [track, additionalTracks]);

    const historicalWeather = useHistoricalWeather(nearestWeatherStation, selectedDate);

    const trackLegs = makeTrackLegs(trackPoints);

    // const selectedPoint = trackPoints[selectedPointIndex];
    // const selectedLeg = trackLegs[selectedPointIndex];

    const selectedLegIndex = findLegIndexByTime(trackLegs, startTime + selectedTime);
    /**
     * @typedef {import("../util/gpx.js").Point} Point
     */

    /** @type {{ from: Point, to: Point, distance: number, heading: number, duration: number}|null} */
    const selectedLeg = trackLegs[selectedLegIndex] || trackLegs[0];

    const markers = [];

    if (selectedPoint) {
        markers.push({ lon: selectedPoint.lon, lat: selectedPoint.lat, name: "red-dot" });
    }

    // markers.push({ lon: centre[0], lat: centre[1], name: "grey-pin" });

    const plotDivisions = 16;

    const distancePlotData = makeCoursePlot(trackLegs, leg => leg.distance, plotDivisions);
    const durationPlotData = makeCoursePlot(trackLegs, leg => leg.duration, plotDivisions);
    const speedPlotData = makeCoursePlot(trackLegs, leg => leg.distance / leg.duration, plotDivisions, "average");
    const maxSpeedPlotData = makeCoursePlot(trackLegs, leg => leg.distance / leg.duration, plotDivisions, "max");

    /** @type {[number, number][]} */
    const instantSpeedHeadingData = trackLegs.map(leg => [leg.heading || 0, leg.distance / leg.duration]);

    const size = Math.min(containerRef.current?.clientWidth || Number.POSITIVE_INFINITY, 800);

    // const startPoint = trackPoints[0];
    // const endPoint = trackPoints[trackPoints.length - 1];

    return (
        <div className="TrackDetails" ref={containerRef}>
            <StaticMap centre={centre} zoom={zoom} width={size} height={size}>
                <WorldLayer />
                <HongKongMarineLayer />
                {/* <DebugLayer /> */}
                {tideVectors && <VectorFieldLayer field={tideVectors} />}
                <PathLayer paths={paths} />
                <MarkerLayer markers={markers} />
                <ControlsLayer setCentre={followPlayingCentre ? null : setCentre} setZoom={setZoom} />
            </StaticMap>
            <div style={{ flexBasis: 500 }}>
                <div>
                    <input type="range" min={0} max={trackLength} value={selectedTime} onChange={e => setSelectedTime(e.target.valueAsNumber)} style={{ width: 400 }} />
                    <button onClick={() => setIsPlaying(isPlaying => !isPlaying)}>{isPlaying ? "Pause" : "Play"}</button>
                    <label style={{ display: "block" }}>
                        <input type="checkbox" checked={followPlayingCentre} onChange={e => setFollowPlayingCentre(e.target.checked)} />
                        Follow
                    </label>
                    {selectedLeg && <p>{selectedDate.toLocaleString()} {labelFns.speed(selectedLeg.distance / selectedLeg.duration)} {selectedLeg.heading.toFixed()}°</p>}
                    {selectedLeg && <p>{selectedLeg.from.lat}, {selectedLeg.from.lon}</p>}
                    {historicalWeather && <p>Automatic Weather: {historicalWeather.windSpeed} km/h {historicalWeather.windDirection}° @ {nearestWeatherStation}</p>}
                </div>
                <PolarPlotSVG values={distancePlotData} marker={selectedLeg?.heading} width={250} height={250} color="red" labelFn={labelFns.distance} arrow={historicalWeather?.windDirection} />
                <PolarPlotSVG values={durationPlotData} marker={selectedLeg?.heading} width={250} height={250} color="blue" labelFn={labelFns.duration} arrow={historicalWeather?.windDirection} />
                <PolarPlotSVG values={speedPlotData} marker={selectedLeg?.heading} width={250} height={250} color="purple" labelFn={labelFns.speed} arrow={historicalWeather?.windDirection} />
                <PolarPlotSVG values={maxSpeedPlotData} marker={selectedLeg?.heading} width={250} height={250} color="green" labelFn={labelFns.speed} arrow={historicalWeather?.windDirection} />
                <PolarPlotSVG
                    values={selectedLegIndex > 0 ? instantSpeedHeadingData.slice(0, selectedLegIndex + 1) : instantSpeedHeadingData}
                    marker={selectedLeg?.heading}
                    markerValue={selectedLeg?.distance / selectedLeg?.duration}
                    width={250}
                    height={250}
                    color={colorFns.rainbow}
                    mode="stacked-sectors"
                    size={2}
                    labelFn={labelFns.speed} arrow={historicalWeather?.windDirection}
                />
                {/* <p>Start: {startPlaceName} ({startPoint.lon},{startPoint.lat})</p>
                <p>End: {endPlaceName} ({endPoint.lon},{endPoint.lat})</p> */}
            </div>
        </div>
    );
}

/**
 * @param {import("../util/gpx.js").Point[]} trackPoints
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

/**
 * @typedef {{from: import("../util/gpx.js").Point; to: import("../util/gpx.js").Point; distance: number; heading: number; duration: number;}} TrackLeg
 */

/**
 * @param {import("../util/gpx.js").Point[]} points
 * @param {number} time
 */
function interpolatePoint(points, time) {
    let prev = points[0];
    for (const point of points) {
        if (point.time && +point.time > time) {
            if (prev && prev.time) {
                const t = (time - +prev.time) / (+point.time - +prev.time);

                return {
                    lon: prev.lon + (point.lon - prev.lon) * t,
                    lat: prev.lat + (point.lat - prev.lat) * t,
                    time,
                };
            }
            return point;
        }
        prev = point;
    }
    return prev;
}

/**
 * @param {TrackLeg[]} legs
 * @param {number} time
 */
function findLegIndexByTime(legs, time) {
    return legs.findIndex(leg => +(leg.from.time || 0) <= time && +(leg.to.time || 0) > time);
}
