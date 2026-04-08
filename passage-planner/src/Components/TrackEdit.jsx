import React, { useEffect, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer.jsx";
import { MarkerLayer } from "../Layers/MarkerLayer.jsx";
import { WorldLayer } from "../Layers/WorldLayer.jsx";
import { StaticMap } from "./StaticMap.jsx";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom.js";
import { ControlsLayer } from "../Layers/ControlsLayer.jsx";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import "./TrackEdit.css";
import { OpenStreetMapLayer } from "../Layers/OpenStreetMapLayer.js";
import { PathLayerSVG } from "../Layers/PathLayerSVG.jsx";

/**
 * @typedef {import("../util/gpx.js").Point[]} TrackSegment
 */

const colors = ["red", "blue", "green", "purple", "orange", "cyan", "magenta"];

/**
 *
 * @param {object} props
 * @param {import("../util/gpx.js").Track} props.track
 * @param {(track: import("../util/gpx.js").Track) => void} props.addTrack
 * @param {import("../util/gpx.js").Track[]} [props.additionalTracks]
 */
export function TrackEdit({ track, addTrack, additionalTracks = [] }) {
    const size = 800;
    const { centre: initialCentre, zoom: initialZoom } = useCentreAndZoom(track, { width: size, height: size });
    const [centre, setCentre] = useState(initialCentre);
    const [zoom, setZoom] = useState(initialZoom);
    const [mode, setMode] = useState("rest");
    const [tempPoint, setTempPoint] = useState(/** @type {import("../util/gpx.js").Point?} */(null));
    const [lines, setLines] = useState(additionalTracks?.map(t => ({ points: t.segments.flat(), color: "orange", lineDash: [4, 4] })) || []); // useSavedState("passage-planner.constructionLines", /** @type {import("../Layers/PathLayer").Path[]} */([]));

    const [newTrackPoints, setNewTrackPoints] = useState(/** @type {TrackSegment} */([])); // useSavedState("passage-planner.newTrackPoints", /** @type {import("../util/gpx").Point[]} */([]));
    const [expandedSegments, setExpandedSegments] = useState(/** @type {number[]} */([]));

    const [segments, setSegments] = useState(/** @type {TrackSegment[]} */(track ? track.segments : []));

    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(-1);
    const [showTimeSetter, setShowTimeSetter] = useState(false);

    const trackPoints = segments.flat();

    // If track changes then recentre
    useEffect(() => {
        if (initialCentre[0] === 0 && initialCentre[1] === 0) {
            return;
        }
        setCentre(initialCentre);
        setZoom(initialZoom);
    }, [initialCentre, initialZoom]);

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

    function setSegmentTime(segmentIndex) {
        setSelectedSegmentIndex(segmentIndex);
        setShowTimeSetter(true);
    }

    function handleDeleteSegment(segmentIndex) {
        setSegments(segments => {
            return segments.filter((s, i) => i !== segmentIndex);
        });
        setExpandedSegments(expandedSegments => expandedSegments.filter(i => i !== segmentIndex));
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
                    <StaticMap
                        centre={centre}
                        zoom={zoom}
                        width={size}
                        height={size}
                        onClick={handleClick}
                        onDragEnd={(lon, lat) => { setCentre([lon, lat]); }}
                        onDoubleClick={(lon, lat) => { setCentre([lon, lat]); setZoom(zoom + 1); }}
                    >
                        <WorldLayer />
                        <OpenStreetMapLayer />
                        <HongKongMarineLayer />
                        {/* <DebugLayer /> */}
                        <PathLayerSVG paths={[...segments.map((s, i) => ({ points: s, color: colors[i % colors.length] })), ...lines, { points: newTrackPoints }]} />
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
                                        <tr key={j} className={className} style={{ borderLeft: `4px solid ${colors[i % colors.length]}` }}>
                                            <td style={{ cursor: "pointer", paddingLeft: 8 }} onClick={() => setCentre([p.lon, p.lat])}>Segment {i} Point {j}</td>
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
                                    <tr className="segment-start" style={{ borderLeft: `4px solid ${colors[i % colors.length]}` }}>
                                        <td style={{ cursor: "pointer", paddingLeft: 8 }} onClick={() => setCentre([point0.lon, point0.lat])}>Segment {i} Start</td>
                                        <td>{point0.lon.toFixed(3)}</td>
                                        <td>{point0.lat.toFixed(3)}</td>
                                        <td>{point0.time?.toLocaleString()}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td>{trkseg.length}</td>
                                        <td>
                                            <button onClick={() => setExpandedSegments(s => [...s, i])}>Expand</button>
                                            <button onClick={() => handleDecimateSegment(i)} disabled={trkseg.length < 11}>Decimate</button>
                                            <button onClick={() => setSegmentTime(i)}>Set Time</button>
                                            <button onClick={() => handleDeleteSegment(i)}>Delete</button>
                                        </td>
                                    </tr>
                                    {pointN &&
                                        <tr className="segment-end" style={{ borderLeft: `4px solid ${colors[i % colors.length]}` }}>
                                            <td style={{ cursor: "pointer", paddingLeft: 8 }} onClick={() => setCentre([pointN.lon, pointN.lat])}>Segment {i} End</td>
                                            <td>{pointN.lon.toFixed(3)}</td>
                                            <td>{pointN.lat.toFixed(3)}</td>
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
            <TimeSetter open={showTimeSetter} onClose={() => setShowTimeSetter(false)} segment={segments[selectedSegmentIndex]} segmentIndex={selectedSegmentIndex} onUpdateTime={(newTime, newDelta) => {
                setSegments(segments => segments.map((s, i) => {
                    if (i === selectedSegmentIndex) {
                        const firstPoint = s[0];
                        const timeDiff = newTime.getTime() - (firstPoint.time?.getTime() || 0);
                        return s.map((p, i) => ({ ...p, time: newDelta ? new Date(newTime.getTime() + newDelta * i) : p.time ? new Date(p.time.getTime() + timeDiff) : undefined }));
                    }
                    return s;
                }));
            }} />
        </>
    );
}

function TimeSetter({ open, onClose, segment, segmentIndex, onUpdateTime }) {
    const [newTime, setNewTime] = useState("");
    const [newDelta, setNewDelta] = useState(30000);

    useEffect(() => {
        if (segment) {
            const firstTime = segment[0].time;
            setNewTime(inputDateTime(firstTime));
        }
    }, [segment]);

    function handleSubmit() {
        if (!newTime) return;
        onUpdateTime(new Date(newTime), newDelta);
        onClose();
    }

    const segmentDuration = segment && segment[0].time && segment[segment.length - 1].time ? (segment[segment.length - 1].time.getTime() - segment[0].time.getTime()) : 0;

    const hasTime = segmentDuration > 0;

    const newSegmentDuration = (segment && newDelta) ? newDelta * (segment.length - 1) : segmentDuration;

    const newEndTime = new Date(new Date(newTime).getTime() + newSegmentDuration);

    return (
        <dialog open={open} onClose={onClose} style={{ position: "fixed", top: 200, width: 640, margin: "0 auto" }}>
            <h3>Set Segment {segmentIndex} Time</h3>
            <p>Setting the time of the first point in the segment will update the times of all subsequent points in the segment accordingly.</p>
            <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: 420 }}>
                <label htmlFor="start-time" style={{ fontWeight: "bold" }}>Start Time</label>
                <input id="start-time" type="datetime-local" step="1" value={newTime} onChange={e => setNewTime(e.target.value)} />
                {!hasTime &&
                    <>
                        <label htmlFor="time-delta" style={{ fontWeight: "bold" }}>Time Delta (seconds)</label>
                        <input id="time-delta" type="number" step={0.1} value={newDelta ? (newDelta / 1000).toFixed(1) : ""} onChange={e => setNewDelta(e.target.value * 1000)} />
                </>
                }
                <label htmlFor="duration" style={{ fontWeight: "bold" }}>Segment Duration</label>
                <input id="duration" step={0.1} value={newSegmentDuration ? formatTime(newSegmentDuration) : formatTime(segmentDuration)} disabled />
                <label htmlFor="end-time" style={{ fontWeight: "bold" }}>End Time</label>
                <input id="end-time" type="datetime-local" step="1" value={inputDateTime(newEndTime) || ""} disabled />
            </div>

            <p>Number of points: {segment ? segment.length : 0}</p>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSubmit}>Save</button>
            </div>
        </dialog>
    );
}

function formatTime(duration) {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 *
 * @param {string|Date?} [value]
 */
function inputDateTime(value) {
    if (!value) return undefined;

    if (typeof value === "string") value = new Date(value);

    if (isNaN(value.getTime())) return undefined;

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

    // Unrecognised method
    throw Error(`Method ${method} is not recognised`);
}