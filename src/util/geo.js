/**
 * @ref https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
 * @param {number} lon
 * @param {number} zoom
 * @returns {number} Integer tilenumber
 */
export function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
/**
 * @param {number} lat
 * @param {number} zoom
 * @returns {number} Integer tilenumber
 */
export function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }

/**
 * @param {number} lon
 * @param {number} zoom
 */
export function lon2tileFrac(lon,zoom) { return ((lon+180)/360*Math.pow(2,zoom)); }
/**
 * @param {number} lat
 * @param {number} zoom
 */
export function lat2tileFrac(lat,zoom)  { return ((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)); }

export function tile2long(x,z) { return (x/Math.pow(2,z)*360-180); }
export function tile2lat(y,z) { var n=Math.PI-2*Math.PI*y/Math.pow(2,z); return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n)))); }

/**
 * @param {[number,number]} centre
 * @param {number} zoom
 * @returns {[number,number,number,number]}
 */
export function getTileBounds (centre, zoom) {
    const tileCountX = 4;
    const tileCountY = 4;

    const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

    const minLon = tile2long(tileOffsetX, zoom);
    const maxLat = tile2lat(tileOffsetY, zoom);
    const maxLon = tile2long(tileOffsetX + tileCountX, zoom);
    const minLat = tile2lat(tileOffsetY + tileCountY, zoom);

    return [minLon,minLat,maxLon,maxLat];
}

// Ref : https://www.movable-type.co.uk/scripts/latlong.html

function lat2nm (lat1, lat2) {
    return Math.abs(lat1 - lat2) * 60;
}

function lon2nm (point1, point2) {
    const avgLat = (point1.lat + point2.lat) / 2;
    const latRad = avgLat / 180 * Math.PI;
    const distAtEquator = 60.1088246;
    return Math.abs(point1.lon - point2.lon) * Math.cos(latRad) * distAtEquator;
}

// Equirectangualr approximation
/**
 * @param {{ lon: number; lat: any; }} point1
 * @param {{ lon: number; lat: any; }} point2
 */
export function latlon2nm (point1, point2) {
    const ns = lat2nm(point1.lat, point2.lat);
    const ew = lon2nm(point1, point2);
    return Math.sqrt(ns * ns + ew * ew);
}

// (Initial bearing)
export function latlon2bearing (point1, point2) {
    const λ1 = point1.lon / 180 * Math.PI;
    const λ2 = point2.lon / 180 * Math.PI;
    const φ1 = point1.lat / 180 * Math.PI;
    const φ2 = point2.lat / 180 * Math.PI;
    const y = Math.sin(λ2-λ1) * Math.cos(φ2);
    const x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    const θ = Math.atan2(y, x);
    return (θ*180/Math.PI + 360) % 360; // in degrees
}

/**
 * @param {import("./gpx").Point[]} points
 */
export function getBoundingBox (points) {
    let minLon = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;

    for (const point of points) {
        minLon = Math.min(minLon, point.lon);
        minLat = Math.min(minLat, point.lat);
        maxLon = Math.max(maxLon, point.lon);
        maxLat = Math.max(maxLat, point.lat);
    }

    return [ minLon, minLat, maxLon, maxLat ];
}