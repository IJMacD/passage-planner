import { useEffect, useMemo, useRef, useState } from "react";

import { useTileJSON } from "../hooks/useTileJSON";
import { Output, BufferTarget, Mp4OutputFormat, CanvasSource, QUALITY_VERY_HIGH } from 'mediabunny';
import { Track } from "../util/gpx";
import { getCentreAndZoom } from "../hooks/useCentreAndZoom";
import { renderLayers } from "../canvas-renderers/renderLayers";
import { TileLayer, PathLayer, Layer } from "../Layers";
import { interpolatePosition } from "../util/interpolatePosition";

export default function ExportVideo({ track, showPreview = false, filename = "trackExport", videoWidth = 1280, videoHeight = 720 }: { track: Track, showPreview?: boolean, filename?: string, videoWidth?: number, videoHeight?: number }) {
    const height = videoHeight / devicePixelRatio;
    const width = videoWidth / devicePixelRatio;
    const [centre, setCentre] = useState<[number, number]>([114.2, 22.35]);
    const [zoom, setZoom] = useState(10);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tileJSON = useTileJSON("https://ijmacd.com/tiles/hongkong-marine/tiles.json");

    useEffect(() => {
        const allPoints = track.segments.flat();
    
        let { centre, zoom } = getCentreAndZoom(allPoints, { width, height });

        setCentre(centre);
        setZoom(zoom);
    }, [track, width, height]);

    const layers = useMemo(() => {
        if (!tileJSON) {
            return [];
        }

        const points = track?.segments.flat() || [];

        return [
            { type: "tile", tileJSON } as TileLayer, 
            { type: "path", paths: [{ points }] } as PathLayer
        ] as Layer[];
    }, [tileJSON, track]) as Layer[];

    const context = useMemo(() => ({ height, width, centre, zoom }), [height, width, centre, zoom]);

    const [isPlaying, setIsPlaying] = useState(false);

    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (canvasRef.current && layers.length > 0) {
            renderLayers(canvasRef.current, context, layers).catch(err => console.error("Error rendering layers:", err));
        }
    }, [context, layers]);

    async function generateAnimation() {
        if (!canvasRef.current || layers.length === 0 || !track) {
            console.error("Canvas or layer or track not available for animation");
            return;
        }

        setDownloadUrl(null);

        const output = new Output({
            format: new Mp4OutputFormat(),
            target: new BufferTarget(),
        });

        const animationFrameRate = 25

        const videoSource = new CanvasSource(canvasRef.current, { codec: 'avc', bitrate: QUALITY_VERY_HIGH });
        output.addVideoTrack(videoSource, {
            frameRate: animationFrameRate,
        });

        await output.start();

        const trackZoom = 16
        const allTrackPoints = track?.segments.flat() || [];
        const trackStartPoint = allTrackPoints[0];
        const trackStart = trackStartPoint ? [trackStartPoint.lon, trackStartPoint.lat] as [number, number] : centre;
        const trackEndPoint = allTrackPoints[allTrackPoints.length - 1];
        const trackEnd = trackEndPoint ? [trackEndPoint.lon, trackEndPoint.lat] as [number, number] : centre;

        let frame = 0;

        frame += await renderZoomToPoint(canvasRef.current, context, layers, videoSource, zoom, trackZoom, centre, trackStart, frame, animationFrameRate);
        
        // Pause for a moment at the end of the zoom
        const pauseDuration = 0.5; // seconds
        for (let i = 0; i < animationFrameRate * pauseDuration; i++) { // 0.5 second pause
            videoSource.add((frame + i)/animationFrameRate, 1/animationFrameRate);
        }
        frame += animationFrameRate * pauseDuration;

        frame += await renderTracePath(canvasRef.current, context, layers, videoSource, track, frame, animationFrameRate, setProgress);

        // Pause for a moment before the zoom out
        for (let i = 0; i < animationFrameRate * pauseDuration; i++) { // 0.5 second pause
            videoSource.add((frame + i)/animationFrameRate, 1/animationFrameRate);
        }
        frame += animationFrameRate * pauseDuration;

        frame += await renderZoomToPoint(canvasRef.current, context, layers, videoSource, trackZoom, zoom, trackEnd, centre, frame, animationFrameRate);

        setIsPlaying(false);

        await output.finalize();

        // Create a blob from the output buffer and generate a download URL
        if (output.target.buffer) {
            const mp4Blob = new Blob([output.target.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(mp4Blob);
            setDownloadUrl(url);
        }
    }

    useEffect(() => {
        if (isPlaying) {
            generateAnimation();
        }
    }, [isPlaying]);


    return (
        <div className="App" style={{ padding: "2em" }}>
            <canvas width={width} height={height} ref={canvasRef} style={{background: "black", border: "1px solid black", width, height, display: showPreview ? "block" : "none" }}></canvas>
            <div>
                <button onClick={() => setIsPlaying(true)} disabled={isPlaying} style={{ marginTop: "1em" }}>Generate Animation</button>
            </div>
            {isPlaying && <div style={{ marginTop: "0.5em" }}>Progress: {(progress * 100).toFixed(1)}%</div>}
            {downloadUrl && (
                <div style={{ marginTop: "1em" }}>
                    <a href={downloadUrl} download={`${filename}.mp4`}>
                        Download Video
                    </a>
                </div>
            )}
            {
                downloadUrl && (
                    <video controls style={{ marginTop: "1em", maxWidth: "100%", height, width }}>
                        <source src={downloadUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )
            }
        </div>
    );
}

async function renderZoomToPoint(canvas: HTMLCanvasElement, context: { height: number, width: number, centre: [number, number], zoom: number }, layers: Layer[], videoSource: CanvasSource, startZoom: number, endZoom: number, startCentre: [number, number], endCentre: [number, number], frameStart: number = 0, frameRate: number = 25): Promise<number> {
    return new Promise<number>(resolve => {
        
        let frame = 0;
        const animationDuration = 2; // seconds
        const frameCount = animationDuration * frameRate;

        if (frameCount <= 1) {
            console.error("Frame count must be greater than 1 for animation");
            resolve(0);
            return;
        }

        const zoomIncrement = (endZoom - startZoom) / (frameCount - 1);
        const centreIncrement: [number, number] = [
            (endCentre[0] - startCentre[0]) / (frameCount - 1),
            (endCentre[1] - startCentre[1]) / (frameCount - 1)
        ];

        const renderFrame = async () => {
            const animationZoom = startZoom + zoomIncrement * frame;
            const animationCentre: [number, number] = [
                startCentre[0] + centreIncrement[0] * frame,
                startCentre[1] + centreIncrement[1] * frame
            ];

            await renderLayers(canvas, { ...context, zoom: animationZoom, centre: animationCentre }, layers);
            videoSource.add((frameStart + frame)/frameRate, 1/frameRate);

            frame++;

            if (frame < frameCount) {
                setTimeout(renderFrame, 1000 / frameRate);
            }
            else {
                resolve(frameCount);
            }
        };

        renderFrame();
    });
}

async function renderTracePath(canvas: HTMLCanvasElement, context: { height: number, width: number, centre: [number, number], zoom: number }, layers: Layer[], videoSource: CanvasSource, track: Track, frameStart: number = 0, frameRate: number = 25, onProgress?: (progress: number) => void): Promise<number> {
    return new Promise<number>(resolve => {
        
        let frame = 0;
        const animationDuration = 60; // seconds
        const frameCount = animationDuration * frameRate;

        if (frameCount <= 1) {
            console.error("Frame count must be greater than 1 for animation");
            resolve(0);
            return;
        }

        const allPoints = track.segments.flat();
        const startPoint = allPoints[0];
        const endPoint = allPoints[allPoints.length - 1];
        const startTime = startPoint.time?.getTime();
        const endTime = endPoint.time?.getTime();

        if (!startTime || !endTime) {
            console.error("Track points must have valid timestamps for trace animation");
            resolve(0);
            return;
        }

        const totalTime = endTime - startTime;

        let currentTime = startTime;
        const timeIncrement = totalTime / (frameCount - 1);

        const renderFrame = async () => {
            const centre = interpolatePosition(allPoints, currentTime);
            if (centre) {
                const animationCentre: [number, number] = [centre.lon, centre.lat];
                const animationZoom = 16; // Fixed zoom level for trace animation

                await renderLayers(canvas, { ...context, zoom: animationZoom, centre: animationCentre }, [...layers, { type: "marker", markers: [{ lon: centre.lon, lat: centre.lat, name: "red-dot" }] }]);
                videoSource.add((frameStart + frame)/frameRate, 1/frameRate);
            }

            frame++;
            currentTime += timeIncrement;
            if (onProgress) {
                onProgress(frame / frameCount);
            }

            if (frame < frameCount) {
                setTimeout(renderFrame, 0); // Render next frame immediately for trace animation
            }
            else {
                resolve(frameCount);
            }
        };

        renderFrame();
    });
}


