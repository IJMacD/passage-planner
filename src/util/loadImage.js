/**
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(Error(`Unable to load ${src}`));
    });
}
