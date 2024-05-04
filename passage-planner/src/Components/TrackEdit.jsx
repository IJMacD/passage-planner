import React, { useEffect, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer.jsx";
import { MarkerLayer } from "../Layers/MarkerLayer.jsx";
import { PathLayer } from "../Layers/PathLayer.jsx";
import { WorldLayer } from "../Layers/WorldLayer.jsx";
import { StaticMap } from "./StaticMap.jsx";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom.js";
import { ControlsLayer } from "../Layers/ControlsLayer.jsx";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import "./TrackEdit.css";

/**
 * @typedef {import("../util/gpx.js").Point[]} TrackSegment
 */

/**
 *
 * @param {object} props
 * @param {import("../util/gpx.js").Track} props.track
 * @param {(track: import("../util/gpx.js").Track) => void} props.addTrack
 * @param {import("../util/gpx.js").Track[]} [props.additionalTracks]
 */
export function TrackEdit({ track, addTrack, additionalTracks = [] }) {
    const { centre: initialCentre, zoom: initialZoom } = useCentreAndZoom(track);
    const [centre, setCentre] = useState(initialCentre);
    const [zoom, setZoom] = useState(initialZoom);
    const [mode, setMode] = useState("rest");
    const [tempPoint, setTempPoint] = useState(/** @type {import("../util/gpx.js").Point?} */(null));
    const [lines, setLines] = useState(additionalTracks?.map(t => ({ points: t.segments.flat(), color: "orange", lineDash: [4, 4] })) || []); // useSavedState("passage-planner.constructionLines", /** @type {import("../Layers/PathLayer").Path[]} */([]));

    const [newTrackPoints, setNewTrackPoints] = useState(/** @type {TrackSegment} */([])); // useSavedState("passage-planner.newTrackPoints", /** @type {import("../util/gpx").Point[]} */([]));
    const [expandedSegments, setExpandedSegments] = useState(/** @type {number[]} */([]));

    const [segments, setSegments] = useState(/** @type {TrackSegment[]} */(track ? track.segments : []));

    const trackPoints = segments.flat();

    // If track changes then recentre
    useEffect(() => {
        if (initialCentre[0] === 0 && initialCentre[1] === 0) {
            return;
        }
        setCentre(initialCentre);
        setZoom(initialZoom);
    }, [initialCentre, initialZoom]);

    useEffect(() => {
        const segments = [
            ...(track ? track.segments : []),
            ...additionalTracks.map(t => t.segments).flat()
        ];
        setSegments(segments);
    }, [track, additionalTracks]);

    if (!track) {
        return null;
    }

    /**
     * @param {any} lon
     * @param {any} lat
     */
    function handleClick(lon, lat) {
        if (mode === "add-construction-line") {
            if (tempPoint) {
                setLines(lines => [...lines, { points: [tempPoint, { lon, lat }], color: "black", lineDash: [4, 4] }]);
                setTempPoint(null);
                setMode("rest");
            }
            else {
                setTempPoint({ lon, lat });
            }
        }
        else if (mode === "draw-track") {
            setNewTrackPoints(points => [...points, { lon, lat }]);
        }
    }

    /** @type {import("../Layers/MarkerLayer.jsx").Marker[]} */
    const markers = [];

    if (tempPoint) {
        markers.push({ ...tempPoint, name: "green-pin" });
    }

    if (newTrackPoints.length === 1) {
        markers.push({ ...newTrackPoints[0], name: "green-pin" });
    }

    /**
     *
     * @param {number} index
     * @param {import('react').ChangeEvent<HTMLInputElement>} event
     */
    function handleDateUpdate(index, event) {
        setNewTrackPoints(points => points.map((p, i) => {
            if (i === index) {
                return { ...p, time: new Date(event.target.value) };
            }
            return p;
        }));
    }

    /**
     *
     * @param {number} index
     * @param {import('react').ChangeEvent<HTMLInputElement>} event
     * Duration in hours
     */
    function handleDurationUpdate(index, event) {
        setNewTrackPoints(points => points.map((p, i) => {
            const prevTime = points[i - 1]?.time;
            if (i === index && prevTime) {
                return { ...p, time: new Date(+prevTime + event.target.valueAsNumber * 3600000) };
            }
            return p;
        }));
    }

    /**
     *
     * @param {number} index
     * @param {import('react').ChangeEvent<HTMLInputElement>} event
     * Speed in knots
     */
    function handleSpeedUpdate(index, event) {
        setNewTrackPoints(points => points.map((p, i) => {
            const prevTime = points[i - 1]?.time;
            if (i === index && prevTime) {
                const leg = getLegByIndex(points, i);
                if (!leg) return p;
                return { ...p, time: new Date(+prevTime + leg?.distance / event.target.valueAsNumber * 3600000) };
            }
            return p;
        }));
    }

    function handleSortSegments() {
        setSegments(segments => [...segments].sort((segA, segB) => {
            return +(segA[0].time || Number.POSITIVE_INFINITY) - +(segB[0].time || Number.POSITIVE_INFINITY);
        }))
    }

    /**
     * @param {number} segmentIndex
     * @param {number} pointIndex
     */
    function handleSegmentSplit(segmentIndex, pointIndex) {
        setSegments(segments => {
            const segment = segments[segmentIndex];
            const newA = segment.slice(0, pointIndex + 1);
            const newB = segment.slice(pointIndex + 1);
            return [...segments.slice(0, segmentIndex), newA, newB, ...segments.slice(segmentIndex + 1)];
        });
        setExpandedSegments(expandedSegments => [...expandedSegments.map(i => i <= segmentIndex ? i : i + 1), segmentIndex + 1])
    }

    function handleSave() {
        const newSegments = segments;

        if (newTrackPoints.length) {
            newSegments.push(newTrackPoints);
        }

        addTrack({ ...track, name: `${track.name} (Edited)`, segments: newSegments })
    }

    /**
     * @param {number} segmentIndex
     * @param {number} factor
     * @param {"first"|"last"|"avg-first-last"|"avg-all"} method
     */
    function handleDecimateSegment(segmentIndex, factor = 10, method = "first") {
        setSegments(segments => {
            return segments.map((s, i) => i === segmentIndex ? decimatePoints(s, factor, method) : s);
        });
    }

    const l = trackPoints.length - 1;

    return (
        <>
            <div className="TrackEdit--Main">
                <div>
                    <button onClick={() => setMode("add-construction-line")} disabled={mode === "add-construction-line"}>Add Construction Line</button>
                    <button onClick={() => setMode(mode === "draw-track" ? "rest" : "draw-track")}>{mode === "draw-track" ? "Finish" : "Draw New Segment"}</button>
                    {mode === "draw-track" && <button onClick={() => setNewTrackPoints(tp => tp.slice(0, -1))} disabled={newTrackPoints.length === 0}>Undo Point</button>}
                    <button onClick={handleSortSegments}>Sort Segments</button>
                    <button onClick={handleSave}>Save As Copy</button>
                </div>

                <div style={{ display: "flex" }}>
                    <StaticMap centre={centre} zoom={zoom} width={800} height={800} onClick={handleClick}>
                        <WorldLayer />
                        <HongKongMarineLayer />
                        {/* <DebugLayer /> */}
                        <PathLayer paths={[{ points: trackPoints }, ...lines, { points: newTrackPoints }]} />
                        <MarkerLayer markers={markers} />
                        <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
                    </StaticMap>
                </div>
            </div>

            <table className="TrackEdit--Table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Lon</th>
                        <th>Lat</th>
                        <th>Time</th>
                        <th>Distance</th>
                        <th>Heading</th>
                        <th>Duration</th>
                        <th>Speed</th>
                        <th>Points</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        segments.map((trkseg, i) => {
                            if (expandedSegments.includes(i)) {
                                return trkseg.map((p, j) => {
                                    const leg = getLegByIndex(trkseg, j + 1);

                                    const className = j === 0 ? "segment-start" :
                                        (j === trkseg.length - 1 ? "segment-end" : "");

                                    return (
                                        <tr key={j} className={className}>
                                            <td>Segment {i} Point {j}</td>
                                            <td>{p.lon.toFixed(5)}</td>
                                            <td>{p.lat.toFixed(5)}</td>
                                            <td>{p.time?.toLocaleString()}</td>
                                            <td>{leg && `${leg.distance.toFixed(2)} nm`}</td>
                                            <td>{leg && `${leg.heading.toFixed()}°`}</td>
                                            <td>{leg?.duration && `${(leg.duration / 3600000).toFixed(1)} hrs`}</td>
                                            <td>{leg?.duration && `${(leg.distance / (leg.duration / 3600000)).toFixed(1)} knots`}</td>
                                            <td></td>
                                            <td>
                                                {j < trkseg.length - 1 && <button onClick={() => handleSegmentSplit(i, j)}>Split After</button>}
                                                {j === 0 && <button onClick={() => setExpandedSegments(s => s.filter(t => t !== i))}>Collapse</button>}
                                            </td>
                                        </tr>
                                    )
                                });
                            }

                            const point0 = trkseg[0];
                            const pointN = trkseg[trkseg.length - 1];

                            return (
                                <React.Fragment key={i}>
                                    <tr className="segment-start">
                                        <td>Segment {i} Start</td>
                                        <td>{point0.lon}</td>
                                        <td>{point0.lat}</td>
                                        <td>{point0.time?.toLocaleString()}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td>{trkseg.length}</td>
                                        <td>
                                            <button onClick={() => setExpandedSegments(s => [...s, i])}>Expand</button>
                                            <button onClick={() => handleDecimateSegment(i)} disabled={trkseg.length < 11}>Decimate</button>
                                        </td>
                                    </tr>
                                    {pointN &&
                                        <tr className="segment-end">
                                            <td>Segment {i} End</td>
                                            <td>{pointN.lon}</td>
                                            <td>{pointN.lat}</td>
                                            <td>{pointN.time?.toLocaleString()}</td>
                                        </tr>
                                    }
                                </React.Fragment>
                            );
                        })
                    }
                    {
                        newTrackPoints.length > 1 && newTrackPoints.map((p, i) => {
                            // TODO: Everything assumes the new track points are
                            // at the end of other segments. Should make everything
                            // more genereic
                            const leg = trackPoints.length > 0 ?
                                getLegByIndex([trackPoints[l], ...newTrackPoints], i + 1) :
                                getLegByIndex(newTrackPoints, i);

                            const className = i === 0 ? "segment-start" :
                                (i === newTrackPoints.length - 1 ? "segment-end" : "");

                            return (
                                <tr key={i} className={className}>
                                    <td>New</td>
                                    <td>{p.lon.toFixed(5)}</td>
                                    <td>{p.lat.toFixed(5)}</td>
                                    <td><input type="datetime-local" value={inputDateTime(p.time)} onChange={e => handleDateUpdate(i, e)} /></td>
                                    <td>{leg && `${leg.distance.toFixed(2)} nm`}</td>
                                    <td>{leg && `${leg.heading.toFixed()}°`}</td>
                                    <td>{i > 0 && leg?.from.time && <><input type="number" step={0.1} style={{ width: 60 }} value={leg?.duration ? (leg.duration / 3600000).toFixed(1) : ""} onChange={e => handleDurationUpdate(i, e)} /> hrs</>}</td>
                                    <td>{i > 0 && leg?.from.time && <><input type="number" step={0.1} style={{ width: 60 }} value={leg?.duration ? (leg.distance / (leg.duration / 3600000)).toFixed(1) : ""} onChange={e => handleSpeedUpdate(i, e)} /> knots</>}</td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </>
    );
}

/**
 *
 * @param {string|Date?} [value]
 */
function inputDateTime(value) {
    if (!value) return undefined;

    if (typeof value === "string") value = new Date(value);

    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
}

/** @param {number} n */
function pad2(n) { return n.toString().padStart(2, "0"); }

/**
 *
 * @param {import("../util/gpx.js").Point[]} points
 * @param {number} index
 * @returns
 */
function getLegByIndex(points, index) {
    if (index < 1 || index >= points.length) return null;

    const from = points[index - 1];
    const to = points[index];

    return {
        from,
        to,
        distance: latlon2nm(from, to),
        heading: latlon2bearing(from, to),
        duration: to.time && from.time && +(to.time || 0) - +(from.time || 0),
    }
}

/**
 * @param {import("../util/gpx.js").Point[]} points
 * @param {number} factor
 * @param {"first"|"last"|"avg-first-last"|"avg-all"} method
 */
function decimatePoints(points, factor, method) {

    if (method === "first") {
        const newPoints = [];
        for (let i = 0; i < points.length; i += factor) {
            newPoints.push(points[i]);
        }
        return newPoints;
    }

    if (method === "last") {
        const newPoints = [];
        for (let i = 0; i <= points.length; i += factor) {
            i > 1 && newPoints.push(points[i - 1]);
        }
        return newPoints;
    }

    if (method === "avg-first-last") {
        /** @type {import("../util/gpx.js").Point[]} */
        const newPoints = [];
        for (let i = 0; i <= points.length; i += factor) {
            const pointA = points[i];
            const pointB = points[i + factor - 1];

            if (!pointB) {
                newPoints.push(pointA);
            }

            const point = {
                lon: (pointA.lon + pointB.lon) / 2,
                lat: (pointA.lat + pointB.lat) / 2,
            };

            if (pointA.time && pointB.time) {
                point.time = new Date((+pointA.time + +pointB.time) / 2);
            }

            newPoints.push(point);
        }
        return newPoints;
    }

    // Unrecognised methed
    throw Error(`Method ${method} is not recognised`);
}