
/**
 *
 * @param {object} props
 * @param {string} props.name
 * @param {number} props.x
 * @param {number} props.y
 * @param {(e: import("react").MouseEvent) => void} [props.onClick]
 * @returns
 */

export function Marker ({ name, x, y, onClick }) {
    const scale = devicePixelRatio >= 2 ? "2x" : "1x";
    const src = require(`../img/markers/${scale}/${name}.png`);

    const imageSize = [32, 32];
    const imageOffset = name === "red-dot" ? [16,16] : [16, 32];

    const left = x - imageOffset[0];
    const top = y - imageOffset[1];
    const width = imageSize[0];
    const height = imageSize[1];

    return <img src={src} style={{ position: "absolute", top, left, width, height }} alt={name} onClick={onClick} />;
}