import React from "react";
import ReactDOM from "react-dom";
import { PolarPlot } from "./Components/PolarPlot.js";
import { StaticMap } from "./Components/StaticMap.jsx";
import { TrackDetails } from "./Components/TrackDetails.js";
import { getCentreAndZoom } from "./hooks/useCentreAndZoom.js";
import { HongKongMarineLayer } from "./Layers/HongKongMarineLayer.js";
import { PathLayer } from "./Layers/PathLayer.js";
import { WorldLayer } from "./Layers/WorldLayer.js";
import { latlon2bearing, latlon2nm } from "./util/geo.js";
import { parseGPXDocument } from "./util/gpx.js";
import { makeCoursePlot } from "./util/makeCoursePlot.js";
import { ControlsLayer } from "./Layers/ControlsLayer.js";

export * as gpx from "./util/gpx.js";

/**
 * @param {ReactDOM.Container} domNode
 * @param {import("./util/gpx").Track?} track
 * @param {import("./util/gpx").Track[]} [additionalTracks]
 */
export function renderTrackDetails (domNode, track, additionalTracks) {
    ReactDOM.render(
        <TrackDetails track={track} additionalTracks={additionalTracks} />,
        domNode
    );
}

/**
 * Renders a single track or an array of tracks
 * @param {ReactDOM.Container} domNode
 * @param {import("./util/gpx").Track|import("./util/gpx").Track[]} track
 */
export function renderTrackMap (domNode, track, { width = 1024, height = 1024 } = {}) {
    const a = Array.isArray(track) ? track : [track];
    const paths = a.map(t => ({ ...t, points: t.segments.flat() }));

    const allPoints = paths.map(p => p.points).flat();

    let { centre, zoom } = getCentreAndZoom(allPoints);

    function setCentre (c) {
        if (c instanceof Function) {
            centre = c(centre);
        }
        else
            centre = c;
        render();
    }

    function setZoom (z) {
        if (z instanceof Function) {
            zoom = z(zoom);
        }
        else
            zoom = z;
        render();
    }

    function render () {
        ReactDOM.render(
            <StaticMap centre={centre} zoom={zoom} width={width} height={height} draggable>
                <WorldLayer />
                <HongKongMarineLayer />
                <PathLayer paths={paths} />
                <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
            </StaticMap>,
            domNode
        );
    }

    render();
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


/**
 * @param {ReactDOM.Container} domNode
 * @param {string[]} gpxStrings
 */
export function renderGPXTracks (domNode, gpxStrings) {
    const gpxList = gpxStrings.map(gpxString => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(gpxString, "text/xml");
        const gpx = parseGPXDocument(doc);
        return gpx.tracks[0];
    });
    renderTrackMap(domNode, gpxList);
}
