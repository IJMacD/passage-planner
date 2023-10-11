import { debugLogAISMessage } from "./debugLogAISMessage.js";
import { decodeRawMessageData } from "./decodeRawMessage.js";

/**
 * @typedef {import("./decodeRawMessage").AISReport} AISReport
 */

export class WebsocketAIS {
    /** @type {((message: AISReport?) => void)[]} */
    #listeners = [];
    /** @type {WebSocket?} */
    #socket = null;

    #socketCallback;

    #totalMessages = 0;

    #messageTypeStats = {};

    #multipartCache = [];

    constructor () {
        this.#socketCallback = (/** @type {{ data: Blob; }} */ event) => {
            /** @type {Blob} */
            const data = event.data;

            if (data.size > 2) {

                // Sometimes websocket data comes with multiline messages
                // in same data packet.
                // However sometimes multiline messages do arrive in sequential
                // data packets.

                data.text().then(t => {
                    let rawMessages = t.trim().split("\r\n");

                    // If we just got a single message in this packet, check to
                    // see if it's part of a multiline message
                    if (rawMessages.length === 1) {
                        let { totalFragments, fragmentNo, sequentialID, channel, data } = parseRawMessageFields(t);

                        if (+totalFragments > 1) {
                            const prevSequenceNo = this.#multipartCache[0]?.sequentialID || sequentialID;

                            if (prevSequenceNo != sequentialID) {
                                // Sequence ID didn't match. Just throw out the
                                // cache and start collecting more messages.
                                this.#multipartCache.length = 0;
                            }

                            // We've received a multipart message, add it to the
                            // cache.
                            this.#multipartCache.push({ rawMessage: t, totalFragments, fragmentNo, sequentialID, channel, data });

                            // Check if this is the last one or not

                            if (+fragmentNo < +totalFragments) {
                                // Not last one, so just stop processing here
                                // for now.
                                return;
                            }

                            // We have just received last of multi part message.
                            // Join messages and start decoding process

                            rawMessages = this.#multipartCache.map(m => m.rawMessage);
                            data = this.#multipartCache.map(m => m.data).join("");
                            this.#multipartCache.length = 0;
                        }
                    }

                    const data = rawMessages.map(m => parseRawMessageFields(m).data).join("");

                    const result = decodeRawMessageData(data);

                    if (result) {
                        // Debug status messages
                        if (result.name) {
                            debugLogAISMessage(rawMessages, data, result);
                        }

                        // Stats
                        this.#totalMessages++;

                        if (typeof this.#messageTypeStats[result.type] === "undefined") {
                            this.#messageTypeStats[result.type] = 1;
                        }
                        else {
                            this.#messageTypeStats[result.type]++;
                        }

                        if (this.#totalMessages % 100 === 0) {
                            console.log(`AIS Messages Total Received: ${this.#totalMessages}`, this.#messageTypeStats);
                        }

                        for (const listener of this.#listeners) {
                            listener(result);
                        }
                    }
                });
            }
        };
    }

    /**
     * @param {(message: AISReport?) => void} listener
     */
    addListener (listener) {
        this.#listeners.push(listener);

        if (!this.#socket) {
            this.#start();
        }
    }

    /**
     * @param {(message: AISReport?) => void} listener
     */
    removeListener (listener) {
        this.#listeners = this.#listeners.filter(l => l !== listener);

        if (this.#listeners.length === 0) {
            this.#stop();
        }
    }

    #start () {
        if (this.#socket) {
            return;
        }

        // Create WebSocket connection.
        this.#socket = new WebSocket('wss://passage.ijmacd.com/wsais');

        // Listen for messages
        this.#socket.addEventListener('message', this.#socketCallback);

        this.#socket.addEventListener("error", e => {
            console.log("Caught WebSocket error. Reconnecting");
            console.log(e);
            this.#stop();
            if (this.#listeners.length > 0) {
                this.#start();
            }
        });
    }

    #stop () {
        if (this.#socket) {
            this.#socket.removeEventListener("message", this.#socketCallback);

            if (this.#socket.readyState === this.#socket.OPEN
                || this.#socket.readyState === this.#socket.CONNECTING)
            {
                this.#socket.close();
            }

            this.#socket = null;
        }
    }
}

/**
 * @param {string} line
 */
function parseRawMessageFields(line) {
    const [type, totalFragments, fragmentNo, sequentialID, channel, data, check] = line.split(",");
    return { type, totalFragments, fragmentNo, sequentialID, channel, data, check };
}
