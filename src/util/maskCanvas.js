/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} config
 * @param {string} config.searchColour
 * @param {number} [config.searchTolerance]
 * @param {string} [config.matchColour]
 * @param {string} [config.nonMatchColour]
 * @param {number} [config.blur]
 */
export function maskCanvas(canvas, config) {
    const {
        searchColour,
        searchTolerance = 10,
        matchColour = "",
        nonMatchColour = "",
        blur = 0,
    } = config;

    const searchColourValue = parseHexColour(searchColour);
    const matchColourValue = !!matchColour && parseHexColour(matchColour);
    const nonMatchColourValue = !!nonMatchColour && parseHexColour(nonMatchColour);

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const { width, height } = canvas;

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
        const pixel = new DataView(d.buffer, i, 4);
        const match = isColourMatch(pixel, searchColourValue, searchTolerance);
        if (match && matchColourValue) {
            setPixel(pixel, matchColourValue);
        }
        else if (!match && nonMatchColourValue) {
            setPixel(pixel, nonMatchColourValue);
        }
    }

    if (blur) {
        const canvas2 = document.createElement("canvas");
        canvas2.width = width;
        canvas2.height = height;
        const ctx2 = canvas2.getContext("2d");
        if (ctx2) {
            ctx2.putImageData(imageData, 0, 0);

            canvas.width = width;
            // ctx.filter = `blur( ${edgeBlur}px ) brightness( ${edgeBrightness}% ) contrast( ${edgeContrast}% )`;
            ctx.filter = `blur( ${blur}px )`;
            ctx.drawImage(canvas2, 0, 0);
        }
    }
    else {
        ctx.putImageData(imageData, 0, 0);
    }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} threshold
 */
export function clampAlpha (canvas, threshold = 127) {
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const { width, height } = canvas;

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        d[i + 3] = a > threshold ? 255: 0;
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * @param {DataView} a
 * @param {number[]} b
 */
function isColourMatch(a, b, tolerance = 10) {
    const d = (
        Math.abs(a.getUint8(0) - b[0]) +
        Math.abs(a.getUint8(1) - b[1]) +
        Math.abs(a.getUint8(2) - b[2])
    ) / 3;

    return d < tolerance;
}
/**
 * @param {DataView} a
 * @param {number[]} b
 */
function setPixel(a, b) {
    a.setUint8(0, b[0]);
    a.setUint8(1, b[1]);
    a.setUint8(2, b[2]);
    a.setUint8(3, b[3]);
}
/**
 * @param {string} hexColour
 * @returns {[r: number, g: number, b: number, a: number]}
 */
function parseHexColour(hexColour) {
    const alphaRe = /#([\dA-f]{2})([\dA-f]{2})([\dA-f]{2})([\dA-f]{2})/i;
    const alphaMatch = alphaRe.exec(hexColour);
    if (alphaMatch) {
        return [
            parseInt(alphaMatch[1], 16),
            parseInt(alphaMatch[2], 16),
            parseInt(alphaMatch[3], 16),
            parseInt(alphaMatch[4], 16),
        ];
    }

    const re = /#([\dA-f]{2})([\dA-f]{2})([\dA-f]{2})/i;
    const matches = re.exec(hexColour);
    if (matches) {
        return [
            parseInt(matches[1], 16),
            parseInt(matches[2], 16),
            parseInt(matches[3], 16),
            255,
        ];
    }

    return [0, 0, 0, 0];
}
