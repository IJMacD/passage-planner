import React from "react";
import ReactDOM from "react-dom";
import { PolarPlot } from "./Components/PolarPlot";
import { StaticMap } from "./Components/StaticMap";
import { TrackDetails } from "./Components/TrackDetails";
import { HongKongMarineLayer } from "./Layers/HongKongMarineLayer";
import { PathLayer } from "./Layers/PathLayer";
import { WorldLayer } from "./Layers/WorldLayer";
import { latlon2bearing, latlon2nm } from "./util/geo";
import { parseGPXDocument } from "./util/gpx";
import { makeCoursePlot } from "./util/makeCoursePlot";

export * as gpx from "./util/gpx";

/**
 * @param {ReactDOM.Container} domNode
 * @param {import("./util/gpx").Track} track
 */
export function renderTrackDetails (domNode, track) {
    ReactDOM.render(
        <TrackDetails track={track} />,
        domNode
    );
}

/**
 * @param {ReactDOM.Container} domNode
 * @param {import("./util/gpx").Track} track
 */
export function renderTrackMap (domNode, track, { width = 1024, height = 1024 } = {}) {
    const trackPoints = track ? track.segments.flat() : [];
    const trackPath = [{ points: trackPoints }];

    const firstPoint = trackPoints[0];
    /** @type {[number, number]} */
    const centre = [ firstPoint.lon, firstPoint.lat ];
    const zoom = 14;

    ReactDOM.render(
        <StaticMap centre={centre} zoom={zoom} width={width} height={height}>
            <WorldLayer />
            <HongKongMarineLayer />
            <PathLayer paths={trackPath} />
        </StaticMap>,
        domNode
    );
}

/**
 * @param {ReactDOM.Container} domNode
 * @param {import("./util/gpx").Track} track
 */
export function renderPolarPlot (domNode, track) {
    const trackPoints = track ? track.segments.flat() : [];
    const trackLegs = trackPoints.map((p, i, a) => ({ from: a[i-1], to: p })).slice(1).map(l => ({ ...l, distance: latlon2nm(l.from, l.to), heading: latlon2bearing(l.from, l.to)}));
    const coursePlotData = makeCoursePlot(trackLegs);

    ReactDOM.render(
        <PolarPlot values={coursePlotData} />,
        domNode
    );
}

/**
 * @param {ReactDOM.Container} domNode
 * @param {string} gpxString
 */
export function renderGPXTrack (domNode, gpxString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxString, "text/xml");
    const gpx = parseGPXDocument(doc);
    renderTrackDetails(domNode, gpx.tracks[0]);
}
