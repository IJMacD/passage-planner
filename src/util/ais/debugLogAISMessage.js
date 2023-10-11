/**
 * @param {string[]} rawMessages
 * @param {string} data
 * @param {import("./decodeRawMessage").AISReport} decoded
 */
export function debugLogAISMessage (rawMessages, data, decoded) {
    const req = indexedDB.open("passage.aisDebug", 1);
    req.onsuccess = () => {
        const db = req.result;
        const txn = db.transaction(["messages"], "readwrite");
        txn.objectStore("messages").put({ time: Date.now(), rawMessages, data, decoded });
    };
    req.onupgradeneeded = () => {
        req.result.createObjectStore("messages", { keyPath: "time" });
    };
}