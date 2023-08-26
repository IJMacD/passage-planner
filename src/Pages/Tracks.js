import React, { useMemo, useState } from "react";
import { TrackDetails } from "../Components/TrackDetails.js";
import { TrackEdit } from "../Components/TrackEdit.js";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { useSavedState } from "../hooks/useSavedState.js";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import { parseGPXDocument, toGPXDocument } from "../util/gpx.js";

// const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef {import("../util/gpx").Track} Track
 */

function Tracks () {
    const [ savedTracks, setSavedTracks ] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));

    const [ bgCheckboxes, setBgCheckboxes ] = useState(() => savedTracks.map(() => false));

    const [ editMode, setEditMode ] = useState(false);

    const [ refreshToken, setRefreshToken ] = useSavedState('logbook.refreshToken', "");

    const [ selectedTrackID, setSelectedTrackID ] = useState(-1);

    const authFetch = useAuthFetch({
        exchangeURL: "https://passage.ijmacd.com/logbook/api/v1/auth/exchange",
        refreshToken,
    });

    const track = useMemo(() => {
        if (selectedTrackID < 0) {
            return null;
        }

        const trackSerialized = savedTracks[selectedTrackID];
        const segments = trackSerialized.segments.map(seg => {
            return seg.map(point => {
                if (typeof point.time === "string") {
                    point.time = new Date(point.time);
                }
                return point;
            });
        });

        return { ...trackSerialized, segments };
    }, [selectedTrackID]);

    /**
     * @param {number} index
     */
    function removeTrack (index) {
        setSavedTracks(tracks => [...tracks.slice(0, index), ...tracks.slice(index+1) ]);
        setSelectedTrackID(oldID => oldID === index ? -1 : oldID);
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
        body.set("start_location", "Hong Kong");
        body.set("start_time", startTime.toISOString());
        body.set("end_location", "Hong Kong");
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
                        setSelectedTrackID(savedTracks.length - 1);
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

    async function handleLogin () {
        const pass = prompt("Token Generation Password");
        if (pass) {
            const body = new FormData();
            body.set("user", "auth_user");
            body.set("pass", pass);

            const token = await fetch("https://passage.ijmacd.com/logbook/api/v1/auth/generate", {
                method: "post",
                body
            }).then(r => r.json()).then(d => d.token);

            setRefreshToken(token);
        }
    }

    /** @type {Track[]} */
    // @ts-ignore
    const bgTracks = bgCheckboxes.map((c,i)=>c?savedTracks[i]:null).filter(x => x);

    return (
        <div style={{padding: "1em"}}>
            <h1>Tracks</h1>

            <div>
                <div>
                    <ul style={{listStyle:"none",padding:0}}>
                        {
                            savedTracks.map((t, i) => (
                                <li key={i}>
                                    <input type="radio" name="track" checked={selectedTrackID === i} onChange={() => setSelectedTrackID(i)} />{' '}
                                    <input type="checkbox" checked={bgCheckboxes[i]||false} disabled={selectedTrackID === i} onChange={e => toggleBgCheckbox(i, e.target.checked)} />{' '}
                                    {t.name}{' '}
                                    <button onClick={() => uploadTrack(t)} disabled={!refreshToken}>Upload</button>{' '}
                                    <button onClick={() => removeTrack(i)}>Remove</button>{' '}
                                </li>)
                            )
                        }
                    </ul>
                    <button onClick={() => setSelectedTrackID(-1)} disabled={selectedTrackID<0}>Clear</button>
                    <button onClick={() => setEditMode(!editMode)} disabled={selectedTrackID<0}>{editMode?"View":"Edit"}</button>
                    <button onClick={handleDownload} disabled={selectedTrackID<0}>Download</button>
                    {!refreshToken && <button onClick={() => handleLogin()}>Login</button>}
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
