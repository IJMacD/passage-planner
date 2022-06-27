/**
 * @ref https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
 * @returns {number} Integer tilenumber
 */
export function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
/**
 * @returns {number} Integer tilenumber
 */
export function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
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