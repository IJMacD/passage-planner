/**
 * @param {Date} d
 * @param {string} f
 */
export function dateFormat(d, f) {
    return f.replace(/%\w/gi, s => {
        switch (s) {
            case '%Y': return d.getFullYear().toString().padStart(4, "0");
            case '%M': return (d.getMonth() + 1).toString().padStart(2, "0");
            case '%D': return d.getDate().toString().padStart(2, "0");
            case '%h': return d.getHours().toString().padStart(2, "0");
            case '%m': return d.getMinutes().toString().padStart(2, "0");
            case '%s': return d.getSeconds().toString().padStart(2, "0");
            default: return s;
        }
    });
}
