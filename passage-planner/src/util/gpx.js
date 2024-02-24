
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

/**
 * @param {Document} doc
 * @returns {GPXDocument}
 */
export function parseGPXDocument(doc) {
    const waypoints = /** @type {Point[]} */ ([]);
    const routes = /** @type {Route[]} */ ([]);
    const tracks = /** @type {Track[]} */ ([]);

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
    };
}
/**
 * @param {Element} el
 */
function parsePoint(el) {
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
    };
}

/**
 *
 * @param {GPXDocument} gpx
 * @returns {Document}
 */
export function toGPXDocument (gpx) {
    const creator = "passage-planner";
    const xmlns = "http://www.topografix.com/GPX/1/1";
    const template = `<gpx version="1.1" creator="${creator}" xmlns="${xmlns}"></gpx>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, "text/xml");

    for (const track of gpx.tracks) {
        const trackEl = doc.createElementNS(xmlns, "trk");

        if (track.name) {
            const nameEl = doc.createElementNS(xmlns, "name");
            nameEl.textContent = track.name;
            trackEl.append(nameEl);
        }

        for (const segment of track.segments) {
            const segEl = doc.createElementNS(xmlns, "trkseg");

            for (const point of segment) {
                const pointEl = doc.createElementNS(xmlns, "trkpt");

                const lonAttr = doc.createAttribute("lon");
                lonAttr.value = point.lon.toFixed(5);
                pointEl.attributes.setNamedItem(lonAttr);

                const latAttr = doc.createAttribute("lat");
                latAttr.value = point.lat.toFixed(5);
                pointEl.attributes.setNamedItem(latAttr);

                if (point.name) {
                    const nameEl = doc.createElementNS(xmlns, "name");
                    nameEl.textContent = point.name;
                    pointEl.append(nameEl);
                }

                if (point.time) {
                    const timeEl = doc.createElementNS(xmlns, "time");
                    timeEl.textContent = point.time.toISOString();
                    pointEl.append(timeEl);
                }

                segEl.append(pointEl);
            }

            trackEl.append(segEl);
        }

        doc.documentElement.append(trackEl);
    }

    return doc;
}