import React, { useMemo, useState } from "react";
import { TrackDetails } from "../Components/TrackDetails.jsx";
import { TrackEdit } from "../Components/TrackEdit.jsx";
import { useAuthFetch } from "../hooks/useAuthFetch.js";
import { useSavedState } from "../hooks/useSavedState.js";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import { parseGPXDocument, toGPXDocument } from "../util/gpx.js";
import "./Tracks.css";

// const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef {import("../util/gpx.js").Track} Track
 */

function Tracks() {
    const [savedTracks, setSavedTracks] = useSavedState("passagePlanner.tracks", /** @type {Track[]} */([]));
    const [refreshToken, setRefreshToken] = useSavedState('logbook.refreshToken', "");

    const [visibleCheckboxes, setVisibleCheckboxes] = useState(() => savedTracks.map((_, i, arr) => i === arr.length - 1));
    const [editMode, setEditMode] = useState(false);
    const [selectedTrackID, setSelectedTrackID] = useState(savedTracks.length > 0 ? savedTracks.length - 1 : -1);
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
        setVisibleCheckboxes(checkboxes => [...checkboxes.slice(0, index), ...checkboxes.slice(index + 1)]);
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
            body.set("name", track.name);
            body.set("total_distance", totalDistance.toFixed(3));
            body.set("start_location", "Hong Kong");
            body.set("start_time", startTime.toISOString());
            body.set("end_location", "Hong Kong");
            body.set("end_time", endTime.toISOString());

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
            for (const file of e.target.files) {
                if (!file.name.toLowerCase().endsWith(".gpx")) {
                    alert(`File ${file.name} is not a GPX file`);
                    return;
                }

                const f = new FileReader();
                f.readAsText(file);
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
                            // Load all tracks and select the first one

                            const newTracks = gpxDoc.tracks.map((t, i, arr) => {
                                if (!t.name) {
                                    t.name = file.name.replace(/\.gpx$/i, "") + (arr.length > 1 ? ` (Track ${i + 1})` : "");
                                }
                                return t;
                            });

                            setSavedTracks(tracks => {
                                setSelectedTrackID(tracks.length);
                                setVisibleCheckboxes(checkboxes => [...checkboxes, ...newTracks.map((_, i, arr) => i === arr.length - 1)]);
                                return [...tracks, ...newTracks];
                            });
                        }
                    }
                });
            }
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

        const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>`, serializer.serializeToString(gpxDoc)]);

        a.href = URL.createObjectURL(blob);

        a.click();

        URL.revokeObjectURL(a.href);

        document.body.removeChild(a);
    }

    function toggleVisibleCheckbox(index, checked) {
        setVisibleCheckboxes(checkboxes => {
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
            setVisibleCheckboxes(checkboxes => [...checkboxes, true]);
            return [...tracks, track];
        });
    }

    function handleMerge() {
        if (!track) return;

        const newTrack = {
            name: track.name + " (Merged)",
            segments: [...track.segments, ...bgTracks.map(t => t.segments).flat()],
        };

        setSavedTracks(tracks => {
            setSelectedTrackID(tracks.length);
            setVisibleCheckboxes(checkboxes => [...checkboxes.map(() => false), true]);
            return [...tracks, newTrack];
        });
    }

    /** @type {Track[]} */
    // @ts-ignore
    const bgTracks = savedTracks.filter((_, i) => i !== selectedTrackID && visibleCheckboxes[i]).map(deserializeTrack);

    return (
        <div style={{ padding: "1em" }}>
            <h1 style={{ margin: 0 }}>Tracks</h1>

            <div className="Tracks-Body">
                <div className="Tracks-Nav" style={{ display: editMode ? "none" : undefined }}>
                    <div>
                        <button onClick={() => handleNewTrack()}>New</button>
                        <button onClick={() => setSelectedTrackID(-1)} disabled={selectedTrackID < 0}>Clear</button>
                        <button onClick={() => setEditMode(!editMode)} disabled={selectedTrackID < 0}>{editMode ? "View" : "Edit"}</button>
                        <button onClick={handleDownload} disabled={selectedTrackID < 0}>Download</button>
                        <button onClick={handleMerge} disabled={selectedTrackID < 0 || bgTracks.length === 0}>Merge Visible</button>
                    </div>
                    <input type="file" onChange={handleFileLoad} multiple accept=".gpx" />
                    {!refreshToken && <button onClick={() => handleLogin()}>Login</button>}
                    {error && <p style={{ color: "red" }}>{error.message}</p>}
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {
                            savedTracks.map((t, i) => (
                                <li key={i} className={`Tracks-Nav-Item ${selectedTrackID === i ? "selected" : ""}`} onClick={e => setSelectedTrackID(i)}>
                                    <input type="checkbox" checked={visibleCheckboxes[i] || selectedTrackID === i || false} disabled={selectedTrackID === i} onChange={e => toggleVisibleCheckbox(i, e.target.checked)} onClick={e => e.stopPropagation()} />{' '}
                                    {t.name ? <span>{t.name}</span> : <span style={{ fontStyle: "italic", color: "grey" }}>No name</span>}{' '}
                                    <button onClick={() => renameTrack(i)}>&#9998;</button>{' '}
                                    <button onClick={() => uploadTrack(t)} disabled={!refreshToken || isUploading}>&uarr;</button>{' '}
                                    <button onClick={() => removeTrack(i)}>&times;</button>{' '}
                                </li>)
                            )
                        }
                    </ul>
                </div>
                {
                    editMode && track &&
                    <div>
                        <h2 style={{ margin: 0 }}>Edit Track: {track.name}</h2>
                        <button onClick={() => setEditMode(false)}>Close</button>
                        <TrackEdit track={track} additionalTracks={bgTracks} addTrack={track => { setSavedTracks(tracks => [...tracks, track]); setEditMode(false); }} />
                    </div>
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

