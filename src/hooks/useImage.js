import { useEffect, useState } from "react";

/**
 * @param {string} src
 */
export function useImage (src) {
    const [ image, setImage ] = useState(/** @type {HTMLImageElement?} */(null));

    useEffect(() => {
        const image = new Image();
        image.src = src;

        image.onload = () => setImage(image);
    }, [src]);

    return image;
}