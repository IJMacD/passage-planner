import React, { useEffect } from "react";
import { useState } from "react";
import { StaticMap } from "../Components/StaticMap";
import { useSavedState } from "../hooks/useSavedState";
import { useTileMetadata } from "../hooks/useTileMetadata";
import { MarkerLayer } from "../Layers/MarkerLayer";
import { PathLayer } from "../Layers/PathLayer";
import { TileMapLayer } from "../Layers/TileMapLayer";
import { WorldLayer } from "../Layers/WorldLayer";

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
    const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);
    const [ savedTracks, setSavedTracks ] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));

    const [ track, setTrack ] = useState(/** @type {Track?} */(null));

    const [ selectedPointIndex, setSelectedPointIndex ] = useState(0);
    const [ isPlaying, setIsPlaying ] = useState(false);

    const [ backgroundTileURL, setBackgroundTileURL ] = useSavedState("passagePlanner.backgroundUrl", "");
    const backgroundMetadata = useTileMetadata(backgroundTileURL);
    const basemapLayer = backgroundMetadata ? {
      layerType: "tiles",
      baseURL: backgroundTileURL,
      ...backgroundMetadata,
    } : null;

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

    const selectedPoint = trackPoints[selectedPointIndex];

    const trackPath = [{ points: trackPoints }];

    const markers = selectedPoint ? [{ lon: selectedPoint.lon, lat: selectedPoint.lat, name: "red-dot" }] : [];


    return (
        <div style={{padding: "1em"}}>
            <h1>Tracks</h1>

            <div style={{display:"flex"}}>
                <div>
                    <ul>
                        {
                            savedTracks.map(t => <li key={t.name}>{t.name} <button onClick={() => loadTrack(t)}>Load</button></li>)
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
                            <p>{selectedPoint.time?.toLocaleString()}</p>
                        </>
                    }
                </div>
                <StaticMap centre={centre} zoom={zoom}>
                    <WorldLayer />
                    { basemapLayer && <TileMapLayer layer={basemapLayer} /> }
                    <PathLayer paths={trackPath} />
                    <MarkerLayer markers={markers} />
                </StaticMap>
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