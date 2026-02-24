import { useEffect, useState } from "react";

import './App.css';
import ExportVideo from "./Components/ExportVideo";
import { parseGPXDocument, Track } from "./util/gpx";

export default function App() {
    const [trackIdInput, setTrackIdInput] = useState<string>("");
    const [trackId, setTrackId] = useState<string|null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [videoWidth, setVideoWidth] = useState<number>(1280);
    const [videoHeight, setVideoHeight] = useState<number>(720);

    const [track, setTrack] = useState<Track | null>(null);

    useEffect(() => {
        fetch(`/logbook/api/v1/logs/${trackId}/track`)
            .then(r => r.text())
            .then(gpxString => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(gpxString, "text/xml");
                const gpx = parseGPXDocument(doc);
                setTrack(gpx.tracks[0]);
            })
            .catch(err => console.error("Error fetching track data:", err));
    }, [trackId]);

    return (
        <div className="App" style={{ padding: "2em" }}>
            <div style={{ marginBottom: "1em", display: "flex", flexWrap: "wrap", gap: "0.5em" }}>
                <button onClick={() => { setTrackId("e4c9d"); setTrackIdInput("e4c9d")}}>Day 1</button>
                <button onClick={() => { setTrackId("48896"); setTrackIdInput("48896")}}>Day 2</button>
                <button onClick={() => { setTrackId("f2970"); setTrackIdInput("f2970")}}>Day 3</button>
                <button onClick={() => { setTrackId("e5a7a"); setTrackIdInput("e5a7a")}}>Day 4</button>
                <input type="text" value={trackIdInput} onChange={e => setTrackIdInput(e.target.value)} placeholder="Enter track ID" style={{ padding: "0.5em", fontSize: "1em" }} />
                <button onClick={() => setTrackId(trackIdInput)} style={{ padding: "0.5em 1em", fontSize: "1em" }}>Load Track</button>
                <label>
                    <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} style={{ marginLeft: "1em" }} /> 
                    Show Preview
                </label>
                <label>
                    Width
                    <input type="range" min="640" max="1920" step="16" value={videoWidth} onChange={e => setVideoWidth(parseInt(e.target.value))} style={{ marginLeft: "1em" }} />
                </label>
                <label>
                    Height
                    <input type="range" min="360" max="1080" step="16" value={videoHeight} onChange={e => setVideoHeight(parseInt(e.target.value))} style={{ marginLeft: "1em" }} />
                </label>
                {videoWidth}x{videoHeight}
            </div>
            {track && <ExportVideo key={trackId} track={track} showPreview={showPreview} videoWidth={videoWidth} videoHeight={videoHeight} />}
        </div>
    )
}
