const promiseCache = {};

/**
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    if (promiseCache[src]) {
        console.log(`Returning cached promise for ${src}`);
        return promiseCache[src];
    }

    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve(img);
            promiseCache[src] = null;
        };
        img.onerror = () => {
            reject(Error(`Unable to load ${src}`));
            promiseCache[src] = null;
        };
    });

    promiseCache[src] = promise;

    return promise;
}
