const promiseCache = {};

/** @type {{ url: string, image: HTMLImageElement }[]} */
const imageCache = [];

const CACHE_SIZE = 100;

/**
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    const cachedImage = imageCache.find(cache => cache && cache.url === src);
    if (cachedImage) {
        return Promise.resolve(cachedImage.image);
    }

    if (promiseCache[src]) {
        // console.log(`Returning cached promise for ${src}`);
        return promiseCache[src];
    }

    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve(img);
            promiseCache[src] = null;

            imageCache.unshift({ url: src, image: img });
            imageCache.length = CACHE_SIZE;
        };
        img.onerror = () => {
            reject(Error(`Unable to load ${src}`));
            promiseCache[src] = null;
        };
    });

    promiseCache[src] = promise;

    return promise;
}
