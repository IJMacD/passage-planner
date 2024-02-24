
export function formatDate (date = new Date()) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function formatDateTimeCompact (date = new Date(), separator = "T") {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${separator}${date.getHours().toString().padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}${date.getSeconds().toString().padStart(2, "0")}`;
}

/**
 * @param {string} date
 * @param {string} time
 */
export function makeDateTime (date, time) {
    return new Date(`${date}T${time}`);
}