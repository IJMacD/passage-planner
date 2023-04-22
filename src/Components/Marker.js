import React, { useEffect, useState } from "react";

const CUSTOM_SIZES = {
    "no-go": [14,32],
    "port-close-hauled": [14,32],
    "port-close-reach": [17,32],
    "port-beam-reach": [22,32],
    "port-broad-reach": [25,32],
    "port-dead-run": [26,32],
    "starboard-close-hauled": [14,32],
    "starboard-close-reach": [17,32],
    "starboard-beam-reach": [22,32],
    "starboard-broad-reach": [25,32],
    "starboard-dead-run": [26,32],
    "dead-run": [26,32],
};

const CUSTOM_OFFSETS = {
    "port-close-reach": [7,16],
    "port-beam-reach": [7,16],
    "port-broad-reach": [7,16],
    "port-dead-run": [7,16],
    "starboard-close-reach": [10,16],
    "starboard-beam-reach": [15,16],
    "starboard-broad-reach": [18,16],
    "starboard-dead-run": [19,16],
    "dead-run": [19,16],
};

/**
 *
 * @param {object} props
 * @param {string} props.name
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} [props.rotation]
 * @param {(e: import("react").MouseEvent) => void} [props.onClick]
 * @returns
 */

export function Marker ({ name, x, y, rotation, onClick }) {
    const [ src, setSrc ] = useState(null);

    const scale = devicePixelRatio >= 2 ? "2x" : "1x";

    useEffect(() => {
        let current = true;

        (async function() {
            try {
                const module = await import(`../img/markers/${scale}/${name}.png`)

                if (current) {
                    setSrc(module.default);
                }
            }
            catch (e) {
                if (scale === "2x") {
                    console.warn(`Marker 2x '${name}' not found`);

                    try {
                        const module = await import(`../img/markers/1x/${name}.png`)
                        if (current) {
                            setSrc(module.default);
                        }
                    }
                    catch (e) {
                        console.warn(`Marker 1x '${name}' not found either`);

                        if (current) {
                            setSrc(null);
                        }
                    }
                }
            }
        }());

        return () => { current = false; };

    }, [name, scale]);

    if (!src) return null;

    const imageSize = CUSTOM_SIZES[name] ?? [32, 32];
    const imageOffset = CUSTOM_OFFSETS[name] ?? [imageSize[0]/2, imageSize[1]/2];

    if (/-pin$/.test(name)) {
        imageOffset[1] = imageSize[1];
    }

    const left = x - imageOffset[0];
    const top = y - imageOffset[1];
    const width = imageSize[0];
    const height = imageSize[1];

    const transform = rotation ? `rotate(${rotation}deg)` : "";
    const transformOrigin = `${imageOffset[0]}px ${imageOffset[1]}px`;

    return <img src={src} style={{ position: "absolute", top, left, width, height, transform, transformOrigin }} alt={name} onClick={onClick} />;
}