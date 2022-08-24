import React, { useEffect, useState } from "react";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";
import { MarkerLayer } from "../Layers/MarkerLayer";
import { PathLayer } from "../Layers/PathLayer";
import { WorldLayer } from "../Layers/WorldLayer";
import { StaticMap } from "./StaticMap";
import { useCentreAndZoom } from "../hooks/useCentreAndZoom";
import { DebugLayer } from "../Layers/DebugLayer";
import { ControlsLayer } from "../Layers/ControlsLayer";
import { useSavedState } from "../hooks/useSavedState";
import { latlon2bearing, latlon2nm } from "../util/geo";

/**
 *
 * @param {object} props
 * @param {import("../util/gpx").Track?} props.track
 * @param {(track: import("../util/gpx").Track) => void} props.addTrack
 */
export function TrackEdit ({ track, addTrack }) {
    const { centre: initialCentre, zoom: initialZoom } = useCentreAndZoom(track);
    const [ centre, setCentre ] = useState(initialCentre);
    const [ zoom, setZoom ] = useState(initialZoom);
    const [ mode, setMode ] = useState("rest");
    const [ tempPoint, setTempPoint ] = useState(/** @type {import("../util/gpx").Point?} */(null));
    const [ lines, setLines ]  = useSavedState("passage-planner.constructionLines", /** @type {import("../Layers/PathLayer").Path[]} */([]));
    const [ newTrackPoints, setNewTrackPoints ]  = useSavedState("passage-planner.newTrackPoints", /** @type {import("../util/gpx").Point[]} */([]));

    const trackPoints = track ? track.segments.flat() : [];

    // If track changes then recentre
    useEffect(() => {
        setCentre(initialCentre);
        setZoom(initialZoom);
    }, [initialCentre, initialZoom]);

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

    /** @type {import("../Layers/MarkerLayer").Marker[]} */
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

    const l = trackPoints.length - 1;

    return (
        <div>
            <button onClick={() => setMode("add-construction-line")} disabled={mode==="add-construction-line"}>Add Construction Line</button>
            <button onClick={() => setMode(mode==="draw-track"?"rest":"draw-track")}>{mode==="draw-track"?"Finish":"Draw Track"}</button>
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
            <table>
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Lon</th>
                        <th>Lat</th>
                        <th>Time</th>
                        <th>Distance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Existing Start</td>
                        <td>{trackPoints[0].lon}</td>
                        <td>{trackPoints[0].lat}</td>
                        <td>{trackPoints[0].time?.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>Existing End</td>
                        <td>{trackPoints[l].lon}</td>
                        <td>{trackPoints[l].lat}</td>
                        <td>{trackPoints[l].time?.toLocaleString()}</td>
                    </tr>
                    {
                        newTrackPoints.map((p,i) => {
                            const leg = getLegByIndex(newTrackPoints, i);
                            return (
                                <tr key={i}>
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
 * @param {Date?} [value]
 */
function inputDateTime (value) {
    if (!value) return undefined;

    return `${value.getFullYear()}-${pad2(value.getMonth()+1)}-${pad2(value.getDate())}T${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
}

/** @param {number} n */
function pad2 (n) { return n.toString().padStart(2, "0"); }

/**
 *
 * @param {import("../util/gpx").Point[]} points
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