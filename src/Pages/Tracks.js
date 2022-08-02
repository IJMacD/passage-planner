import React, { useState } from "react";
import { TrackDetails } from "../Components/TrackDetails";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useSavedState } from "../hooks/useSavedState";
import { latlon2bearing, latlon2nm } from "../util/geo";
import { parseGPXDocument, toGPXDocument } from "../util/gpx";

const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef {import("../util/gpx").Track} Track
 */

function Tracks () {
    const [ savedTracks, setSavedTracks ] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));

    const [ track, setTrack ] = useState(/** @type {Track?} */(null));

    const authFetch = useAuthFetch({
        exchangeURL: "https://passage.ijmacd.com/logbook/api/v1/auth/exchange",
        refreshToken: localStorage['logbook.refreshToken'],
    });

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
        .then(r => r.json())
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

                </div>
                <TrackDetails track={track} />
            </div>

        </div>
    )
}

export default Tracks;
