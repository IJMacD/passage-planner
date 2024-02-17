/**
 *
 * @returns {Promise<IDBDatabase>}
 */
function getDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open("passage.ais", 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            const vesselObjectStore = db.createObjectStore("vessels", { keyPath: "mmsi" });
            const positionsObjectStore = db.createObjectStore("positions", { keyPath: "lastUpdate" });
            positionsObjectStore.createIndex("mmsi", "mmsi");
        };
        req.onsuccess = () => {
            resolve(req.result);
        };
        req.onerror = () => {
            reject(req.error);
        };
    });
}

/**
 * @param {import("./ais").VesselReport} vessel
 */
export async function saveVessel (vessel) {
    const db = await getDB();
    const txn = db.transaction(["vessels"], "readwrite");
    txn.objectStore("vessels").put(vessel);
}

/**
 * @param {import("./ais").VesselReport} report
 */
export async function savePosition (report) {
    const db = await getDB();
    const txn = db.transaction(["positions"], "readwrite");
    txn.objectStore("positions").put(report);
}

/**
 * @param {number} mmsi
 * @returns {Promise<import("./ais").VesselReport>}
 */
export async function getVessel (mmsi) {
    const db = await getDB();
    const txn = db.transaction(["vessels"], "readonly");
    const objectStore = txn.objectStore("vessels");
    return requestToPromise(objectStore.get(mmsi));
}

/**
 * @param {number} mmsi
 * @returns {Promise<import("./ais").VesselReport[]>}
 */
export async function getPositions (mmsi, startTime = 0) {
    const db = await getDB();
    const txn = db.transaction(["positions"], "readonly");
    const objectStore = txn.objectStore("positions");
    const index = objectStore.index("mmsi");
    const request = index.getAll(mmsi);
    return requestToPromise(request);
}

/**
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}
