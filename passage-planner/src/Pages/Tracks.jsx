import React, { useMemo, useState } from "react";
import { TrackDetails } from "../Components/TrackDetails.jsx";
import { TrackEdit } from "../Components/TrackEdit.jsx";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { useSavedState } from "../hooks/useSavedState.js";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import { parseGPXDocument, toGPXDocument } from "../util/gpx.js";

// const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef {import("../util/gpx.js").Track} Track
 */

function Tracks() {
    const [savedTracks, setSavedTracks] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));
    const [refreshToken, setRefreshToken] = useSavedState('logbook.refreshToken', "");

    const [bgCheckboxes, setBgCheckboxes] = useState(() => savedTracks.map(() => false));
    const [editMode, setEditMode] = useState(false);
    const [selectedTrackID, setSelectedTrackID] = useState(-1);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(/** @type {Error|null} */(null));


    const authFetch = useAuthFetch({
        exchangeURL: "/logbook/api/v1/auth/exchange",
        refreshToken,
    });

    const track = useMemo(() => {
        const trackSerialized = savedTracks[selectedTrackID];

        if (!trackSerialized) {
            return null;
        }

        const segments = deserializeTrack(trackSerialized).segments;

        return { ...trackSerialized, segments };
    }, [savedTracks, selectedTrackID]);

    /**
     * @param {number} index
     */
    function removeTrack(index) {
        setSavedTracks(tracks => [...tracks.slice(0, index), ...tracks.slice(index + 1)]);
        setSelectedTrackID(oldID => oldID === index ? -1 : (oldID < index ? oldID : oldID - 1));
    }

    /**
     * @param {number} index
     */
    function renameTrack(index) {
        const name = prompt("Enter track name", savedTracks[index].name || "");
        setSavedTracks(tracks => tracks.map((t, i) => i === index ? { ...t, name } : t));
    }

    /**
     * @param {Track} track
     */
    function uploadTrack(track) {
        try {
            // Deserialise just in case track hasn't been viewed yet.
            track = deserializeTrack(track);

            const trackPoints = track ? track.segments.flat() : [];
            const trackLegs = trackPoints.map((p, i, a) => ({ from: a[i - 1], to: p })).slice(1).map(l => ({ ...l, distance: latlon2nm(l.from, l.to), heading: latlon2bearing(l.from, l.to) }));
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

            setIsUploading(true);

            authFetch("/logbook/api/v1/logs", {
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

                    return authFetch(`/logbook/api/v1/logs/${id}/track`, {
                        method: "post",
                        body,
                    })
                        .then(r => r.json())
                        .then(d => {
                            console.log(d);
                            alert("Uploaded");
                        });
                })
                .catch(setError)
                .finally(() => {
                    setIsUploading(false);
                });
        }
        catch (e) {
            setError(e);
        }
    }

    /**
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleFileLoad(e) {
        if (e.target.files && e.target.files.length > 0) {
            const f = new FileReader();
            f.readAsText(e.target.files[0]);
            f.addEventListener("load", e => {
                const text = e.target?.result;
                if (typeof text === "string") {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/xml");
                    const gpxDoc = parseGPXDocument(doc);

                    // Convert one route to track if needed
                    if (gpxDoc.tracks.length === 0 && gpxDoc.routes.length > 0) {
                        const route = gpxDoc.routes.pop();
                        if (route) {
                            const name = route.name;
                            const track = { name, segments: [route.points] };
                            gpxDoc.tracks.push(track);
                            console.log("Converted route to track");
                        }
                    }

                    if (gpxDoc.tracks.length > 0) {
                        const track = gpxDoc.tracks[0];
                        setSavedTracks(tracks => {
                            setSelectedTrackID(tracks.length);
                            return [...tracks, track];
                        });
                    }
                }
            });
            e.target.value = "";
        }
    }

    function handleDownload() {
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

    function toggleBgCheckbox(index, checked) {
        setBgCheckboxes(checkboxes => {
            const updated = checkboxes.slice();
            updated[index] = checked;
            return updated;
        });
    }

    async function handleLogin() {
        const token = await fetch("/logbook/api/v1/auth/generate")
            .then(r => r.json())
            .then(d => d.token);

        setRefreshToken(token);
    }

    function handleNewTrack() {
        const track = {
            name: "New Track",
            segments: [],
        };
        setSavedTracks(tracks => {
            setSelectedTrackID(tracks.length);
            return [...tracks, track];
        });
    }

    /** @type {Track[]} */
    // @ts-ignore
    const bgTracks = bgCheckboxes.map((c, i) => c ? deserializeTrack(savedTracks[i]) : null).filter(x => x);

    return (
        <div style={{ padding: "1em" }}>
            <h1 style={{ margin: 0 }}>Tracks</h1>

            <div>
                <div>
                    <button onClick={() => handleNewTrack()}>New</button>
                    <button onClick={() => setSelectedTrackID(-1)} disabled={selectedTrackID < 0}>Clear</button>
                    <button onClick={() => setEditMode(!editMode)} disabled={selectedTrackID < 0}>{editMode ? "View" : "Edit"}</button>
                    <button onClick={handleDownload} disabled={selectedTrackID < 0}>Download</button>
                    <input type="file" onChange={handleFileLoad} />
                    {!refreshToken && <button onClick={() => handleLogin()}>Login</button>}
                    {error && <p style={{ color: "red" }}>{error.message}</p>}
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {
                            savedTracks.map((t, i) => (
                                <li key={i}>
                                    <input type="radio" id={`saved-track-select-${i}`} name="track" checked={selectedTrackID === i} onChange={() => setSelectedTrackID(i)} />{' '}
                                    <input type="checkbox" checked={bgCheckboxes[i] || false} disabled={selectedTrackID === i} onChange={e => toggleBgCheckbox(i, e.target.checked)} />{' '}
                                    <label htmlFor={`saved-track-select-${i}`}>{t.name || <span style={{ fontStyle: "italic", color: "grey" }}>No name</span>}</label>{' '}
                                    <button onClick={() => renameTrack(i)}>Rename</button>{' '}
                                    <button onClick={() => uploadTrack(t)} disabled={!refreshToken || isUploading}>Upload</button>{' '}
                                    <button onClick={() => removeTrack(i)}>Remove</button>{' '}
                                </li>)
                            )
                        }
                    </ul>
                </div>
                {
                    editMode && track &&
                    <>
                        <h2 style={{ margin: 0 }}>Edit Track: {track.name}</h2>
                        <TrackEdit track={track} additionalTracks={bgTracks} addTrack={track => setSavedTracks(tracks => [...tracks, track])} />
                    </>
                }
                {
                    !editMode && track &&
                    <TrackDetails track={track} additionalTracks={bgTracks} />
                }
            </div>

        </div>
    )
}

export default Tracks;

/**
 * Inflate dates from string to Date objects
 * @param {Track} trackSerialized
 * @returns
 */
function deserializeTrack(trackSerialized) {
    return {
        ...trackSerialized,
        segments: trackSerialized.segments.map(seg => {
            return seg.map(point => {
                if (typeof point.time === "string") {
                    point.time = new Date(point.time);
                }
                return point;
            });
        })
    };
}

