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
 * @param {import("../util/gpx.js").Track?} props.track
 * @param {(track: import("../util/gpx.js").Track) => void} props.addTrack
 * @param {import("../util/gpx.js").Track[]} [props.additionalTracks]
 */
export function TrackEdit ({ track, addTrack, additionalTracks }) {
    const { centre: initialCentre, zoom: initialZoom } = useCentreAndZoom(track);
    const [ centre, setCentre ] = useState(initialCentre);
    const [ zoom, setZoom ] = useState(initialZoom);
    const [ mode, setMode ] = useState("rest");
    const [ tempPoint, setTempPoint ] = useState(/** @type {import("../util/gpx.js").Point?} */(null));
    const [ lines, setLines ] = useState(additionalTracks?.map(t => ({ points: t.segments.flat(), color: "orange", lineDash: [4,4] })) || []); // useSavedState("passage-planner.constructionLines", /** @type {import("../Layers/PathLayer").Path[]} */([]));

    const [ newTrackPoints, setNewTrackPoints ] = useState(/** @type {TrackSegment} */([])); // useSavedState("passage-planner.newTrackPoints", /** @type {import("../util/gpx").Point[]} */([]));
    const [ expandedSegments, setExpandedSegments ] = useState(/** @type {number[]} */([]));

    const [ segments, setSegments ] = useState(/** @type {TrackSegment[]} */(track?track.segments:[]));

    const trackPoints = segments.flat();

    // If track changes then recentre
    useEffect(() => {
        setCentre(initialCentre);
        setZoom(initialZoom);
    }, [initialCentre, initialZoom]);

    useEffect(() => {
        setSegments(track?track.segments:[]);
    }, [track]);

    if (!track) {
        return null;
    }

    function handleClick (lon, lat) {
        if (mode === "add-construction-line") {
            if (tempPoint) {
                setLines(lines => [ ...lines, { points: [tempPoint, { lon, lat }], color: "black", lineDash: [4,4] } ]);
                setTempPoint(null);
                setMode("rest");
            }
            else {
                setTempPoint({ lon, lat });
            }
        }
        else if (mode === "draw-track") {
            setNewTrackPoints(points => [...points, {lon, lat}]);
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
    function handleDateUpdate (index, event) {
        setNewTrackPoints(points => points.map((p, i) => {
            if (i === index) {
                return { ...p, time: new Date(event.target.value) };
            }
            return p;
        }));
    }

    function handleSortPoints () {

    }

    function handleSegmentSplit (segmentIndex, pointIndex) {
        setSegments(segments => {
            const segment = segments[segmentIndex];
            const newA = segment.slice(0, pointIndex + 1);
            const newB = segment.slice(pointIndex + 1);
            return [...segments.slice(0, segmentIndex), newA, newB, ...segments.slice(segmentIndex+1) ];
        });
    }

    const l = trackPoints.length - 1;

    return (
        <div>
            <button onClick={() => setMode("add-construction-line")} disabled={mode==="add-construction-line"}>Add Construction Line</button>
            <button onClick={() => setMode(mode==="draw-track"?"rest":"draw-track")}>{mode==="draw-track"?"Finish":"Draw Track"}</button>
            {mode==="draw-track"&&<button onClick={() => setNewTrackPoints(tp => tp.slice(0, -1))} disabled={newTrackPoints.length === 0}>Undo Point</button>}
            <button onClick={handleSortPoints}>Sort Points</button>
            <button onClick={() => addTrack({ ...track, segments: [ ...track.segments, newTrackPoints ]})}>Save Track</button>
            <div style={{display:"flex"}}>
                <StaticMap centre={centre} zoom={zoom} width={800} height={800} onClick={handleClick}>
                    <WorldLayer />
                    <HongKongMarineLayer />
                    {/* <DebugLayer /> */}
                    <PathLayer paths={[{ points: trackPoints }, ...lines, { points: newTrackPoints }]} />
                    <MarkerLayer markers={markers} />
                    <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
                </StaticMap>
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        segments.map((trkseg, i) => {
                            if (expandedSegments.includes(i)) {
                                return trkseg.map((p, j) => {
                                    const leg = getLegByIndex(trkseg, j+1);

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
                                            <td>
                                                {j<trkseg.length-1 && <button onClick={() => handleSegmentSplit(i, j)}>Split After</button>}
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
                                        <td>
                                            <button onClick={() => setExpandedSegments(s => [...s, i])}>Expand</button>
                                        </td>
                                    </tr>
                                    <tr className="segment-end">
                                        <td>Segment {i} End</td>
                                        <td>{pointN.lon}</td>
                                        <td>{pointN.lat}</td>
                                        <td>{pointN.time?.toLocaleString()}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })
                    }
                    {
                        newTrackPoints.map((p,i) => {
                            const leg = getLegByIndex([trackPoints[l], ...newTrackPoints], i+1);

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
                                    <td>{leg?.duration && `${(leg.duration / 3600000).toFixed(1)} hrs`}</td>
                                    <td>{leg?.duration && `${(leg.distance / (leg.duration / 3600000)).toFixed(1)} knots`}</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
    );
}

/**
 *
 * @param {string|Date?} [value]
 */
function inputDateTime (value) {
    if (!value) return undefined;

    if (typeof value === "string") value = new Date(value);

    return `${value.getFullYear()}-${pad2(value.getMonth()+1)}-${pad2(value.getDate())}T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
}

/** @param {number} n */
function pad2 (n) { return n.toString().padStart(2, "0"); }

/**
 *
 * @param {import("../util/gpx.js").Point[]} points
 * @param {number} index
 * @returns
 */
function getLegByIndex (points, index) {
    if (index < 1 || index >= points.length) return null;

    const from = points[index-1];
    const to = points[index];

    return {
        distance: latlon2nm(from, to),
        heading: latlon2bearing(from, to),
        duration: to.time && from.time && +(to.time || 0) - +(from.time || 0),
    }
}