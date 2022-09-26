import React, { useState } from "react";
import { TrackDetails } from "../Components/TrackDetails";
import { TrackEdit } from "../Components/TrackEdit";
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

    const [ bgCheckboxes, setBgCheckboxes ] = useState(() => savedTracks.map(() => false));

    const [ track, setTrack ] = useState(/** @type {Track?} */(null));

    const [ editMode, setEditMode ] = useState(false);

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

    function removeTrack (index) {
        setSavedTracks(tracks => [...tracks.slice(0, index), ...tracks.slice(index+1) ]);
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
            .then(d => {
                console.log(d);
                alert("Uploaded");
            });
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

    function handleDownload () {
        if (!track) return;

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.download = `${track.name}.gpx`;

        const gpxDoc = toGPXDocument({ tracks: [track], waypoints: [], routes: [] });
        const serializer = new XMLSerializer();

        const blob = new Blob([serializer.serializeToString(gpxDoc)]);

        a.href = URL.createObjectURL(blob);

        a.click();

        URL.revokeObjectURL(a.href);

        document.body.removeChild(a);
    }

    function toggleBgCheckbox (index, checked) {
        setBgCheckboxes(checkboxes => {
            const updated = checkboxes.slice();
            updated[index] = checked;
            return updated;
        });
    }

    /** @type {Track[]} */
    // @ts-ignore
    const bgTracks = bgCheckboxes.map((c,i)=>c?savedTracks[i]:null).filter(x => x);

    return (
        <div style={{padding: "1em"}}>
            <h1>Tracks</h1>

            <div>
                <div>
                    <ul>
                        {
                            savedTracks.map((t, i) => (
                                <li key={i}>
                                    <input type="checkbox" checked={bgCheckboxes[i]||false} onChange={e => toggleBgCheckbox(i, e.target.checked)} />{' '}
                                    {t.name}{' '}
                                    <button onClick={() => loadTrack(t)}>Load</button>{' '}
                                    <button onClick={() => uploadTrack(t)}>Upload</button>{' '}
                                    <button onClick={() => removeTrack(i)}>Remove</button>{' '}
                                </li>)
                            )
                        }
                    </ul>
                    <button onClick={() => setTrack(null)}>Clear</button>
                    <button onClick={() => setEditMode(!editMode)}>{editMode?"View":"Edit"}</button>
                    <button onClick={handleDownload}>Download</button>
                    <br/>
                    <input type="file" onChange={handleFileLoad} />
                    {/* <input value={track.name} onChange={e => setTrack(t => ({ ...t, name: e.target.value }))} /> */}
                </div>
                {
                    editMode ?
                    <TrackEdit track={track} additionalTracks={bgTracks} addTrack={track => setSavedTracks(tracks => [...tracks, track])} /> :
                    <TrackDetails track={track} additionalTracks={bgTracks} />
                }
            </div>

        </div>
    )
}

export default Tracks;
