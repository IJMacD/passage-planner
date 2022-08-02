import React, { useEffect } from "react";
import { useState } from "react";
import { BasicMap } from "../Components/BasicMap";
import { PolarPlot } from "../Components/PolarPlot";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useSavedState } from "../hooks/useSavedState";
import { MarkerLayer } from "../Layers/MarkerLayer";
import { PathLayer } from "../Layers/PathLayer";
import { latlon2bearing, latlon2nm } from "../util/geo";

const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef GPXDocument
 * @prop {Point[]} waypoints
 * @prop {Route[]} routes
 * @prop {Track[]} tracks
 */

/**
 * @typedef {{name: string?;segments: Point[][];}} Track
 */

/**
 * @typedef {{name: string?;points: Point[];}} Route
 */

/**
 * @typedef Point
 * @prop {number} lon
 * @prop {number} lat
 * @prop {string?} [name]
 * @prop {Date?} [time]
*/

function Tracks () {
    const [ savedTracks, setSavedTracks ] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));

    const [ track, setTrack ] = useState(/** @type {Track?} */(null));

    const authFetch = useAuthFetch({
        exchangeURL: "https://passage.ijmacd.com/logbook/api/v1/auth/exchange",
        refreshToken: localStorage['logbook.refreshToken'],
    });
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

    function loadTrack (trackSerialized) {
        const segments = trackSerialized.segments.map(seg => {
            return seg.map(point => {
                if (typeof point.time === "string") {
                    point.time = new Date(point.time);
                }
                return point;
            });
        });
        setTrack({ ...trackSerialized, segments });
    }

    /**
     * @param {Track} track
     */
    function uploadTrack (track) {
        const trackPoints = track ? track.segments.flat() : [];
        const trackLegs = trackPoints.map((p, i, a) => ({ from: a[i-1], to: p })).slice(1).map(l => ({ ...l, distance: latlon2nm(l.from, l.to), heading: latlon2bearing(l.from, l.to)}));
        const totalDistance = trackLegs.reduce((total, leg) => total + leg.distance, 0);

        const l = trackPoints.length - 1;
        const startTime = trackPoints[0].time;
        const endTime = trackPoints[l].time;

        if (l < 0 || !startTime || !endTime) {
            return;
        }

        const body = new FormData();
        body.set("total_distance", totalDistance.toFixed(3));
        body.set("start_location", "Peng Chau, HK");
        body.set("start_time", startTime.toISOString());
        body.set("end_location", "Peng Chau, HK");
        body.set("end_time", endTime.toISOString());
        body.set("weather", "");
        body.set("comments", "");

        authFetch("https://passage.ijmacd.com/logbook/api/v1/logs", {
            method: "post",
            body,
        })
        .then((/** @type {Response} */ r) => r.json())
        .then(result => {
            const { id } = result;

            const gpxDoc = toGPXDocument({ tracks: [track], waypoints: [], routes: [] });
            const serializer = new XMLSerializer();

            const body = new FormData();

            body.set("gpx", new Blob([serializer.serializeToString(gpxDoc)]));

            authFetch(`https://passage.ijmacd.com/logbook/api/v1/logs/${id}/track`, {
                method: "post",
                body,
            })
            .then(r => r.json())
            .then(d => console.log(d));
        });
    }

    /**
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleFileLoad (e) {
        if (e.target.files && e.target.files.length > 0) {
            const f = new FileReader();
            f.readAsText(e.target.files[0]);
            f.addEventListener("load", e => {
                const text = e.target?.result;
                if (typeof text === "string") {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/xml");
                    const gpxDoc = parseGPXDocument(doc);

                    if (gpxDoc.tracks.length > 0) {
                        const track = gpxDoc.tracks[0];
                        setSavedTracks(tracks => [ ...tracks, track ]);
                        setTrack(track);
                    }
                }
            });
        }
    }

    const trackPoints = track ? track.segments.flat() : [];

    /** @type {Point?} */
    const selectedPoint = trackPoints[selectedPointIndex];

    const trackPath = [{ points: trackPoints }];

    const markers = selectedPoint ? [{ lon: selectedPoint.lon, lat: selectedPoint.lat, name: "red-dot" }] : [];

    const trackLegs = trackPoints.map((p, i, a) => ({ from: a[i-1], to: p })).slice(1).map(l => ({ ...l, distance: latlon2nm(l.from, l.to), heading: latlon2bearing(l.from, l.to)}));

    const totalDistance = trackLegs.reduce((total, leg) => total + leg.distance, 0);

    const coursePlotData = makeCoursePlot(trackLegs);

    return (
        <div style={{padding: "1em"}}>
            <h1>Tracks</h1>

            <div style={{display:"flex"}}>
                <div>
                    <ul>
                        {
                            savedTracks.map(t => <li key={t.name}>{t.name} <button onClick={() => loadTrack(t)}>Load</button> <button onClick={() => uploadTrack(t)}>Upload</button></li>)
                        }
                    </ul>
                    <button onClick={() => setTrack(null)}>Clear</button><br/>
                    <input type="file" onChange={handleFileLoad} />
                    {/* <input value={track.name} onChange={e => setTrack(t => ({ ...t, name: e.target.value }))} /> */}
                    { track &&
                        <>
                            <p>{track.name}</p>
                            <input type="range" min={0} max={trackPoints.length} value={selectedPointIndex} onChange={e => setSelectedPointIndex(e.target.valueAsNumber)} />
                            <button onClick={() => setIsPlaying(isPlaying => !isPlaying)}>{isPlaying?"Pause":"Play"}</button>
                            <p>{selectedPoint?.time?.toLocaleString()}</p>
                        </>
                    }
                </div>
                <div>
                    <BasicMap>
                        <PathLayer paths={trackPath} />
                        <MarkerLayer markers={markers} />
                    </BasicMap>
                    { track &&
                        <div>
                            <p>
                                {totalDistance} NM
                            </p>
                            <PolarPlot values={coursePlotData} marker={trackLegs[selectedPointIndex]?.heading} />
                        </div>
                    }
                </div>
            </div>

        </div>
    )
}

export default Tracks;


/**
 * @param {Document} doc
 * @returns {GPXDocument}
 */
function parseGPXDocument (doc) {
    const waypoints = /** @type {Point[]} */([]);
    const routes = /** @type {Route[]} */([]);
    const tracks = /** @type {Track[]} */([]);

    const wpts = doc.getElementsByTagName("wpt");
    for (const wpt of wpts) {
        waypoints.push(parsePoint(wpt));
    }

    const rtes = doc.getElementsByTagName("rte");
    for (const rte of rtes) {
        const name = rte.getElementsByTagName("name").item(0)?.textContent || null;
        /** @type {Route} */
        const route = { name, points: [] };
        const rtepts = rte.getElementsByTagName("rtept");
        for (const rtept of rtepts) {
            route.points.push(parsePoint(rtept));
        }
        routes.push(route);
    }

    const trks = doc.getElementsByTagName("trk");
    for (const trk of trks) {
        const name = trk.getElementsByTagName("name").item(0)?.textContent || null;
        /** @type {Track} */
        const track = { name, segments: [] };
        const trksegs = trk.getElementsByTagName("trkseg");
        for (const trkseg of trksegs) {
            const seg = [];
            const trkpts = trkseg.getElementsByTagName("trkpt");
            for (const trkpt of trkpts) {
                seg.push(parsePoint(trkpt));
            }
            track.segments.push(seg);
        }
        tracks.push(track);
    }

    return {
        waypoints,
        routes,
        tracks,
    }
}

/**
 * @param {Element} el
 */
function parsePoint (el) {
    // @ts-ignore
    const lon = +el.getAttribute("lon");
    // @ts-ignore
    const lat = +el.getAttribute("lat");
    const name = el.getElementsByTagName("name").item(0)?.textContent || null;
    const timeText = el.getElementsByTagName("time").item(0)?.textContent;
    const time = timeText ? new Date(timeText) : null;

    return {
        lon,
        lat,
        name,
        time,
    }
}

/**
 * @param {{ from: Point; to: Point; distance: number; heading: number; }[]} legs
 * @returns {[number, number][]}
 */
function makeCoursePlot (legs, divisions = 24) {
    const out = Array.from({length: divisions}).fill(0);
    const theta = 360 / divisions;

    for (const leg of legs) {
        let index = Math.floor((leg.heading + theta/2) / theta);
        if (index >= divisions) index = 0;

        out[index] += leg.distance;
    }

    return out.map((v, i) => [i * theta, v]);
}