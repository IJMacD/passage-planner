import { decodeRawMessage } from "./decodeRawMessage.js";

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

    constructor () {
        this.#socketCallback = (/** @type {{ data: Blob; }} */ event) => {
            /** @type {Blob} */
            const data = event.data;

            if (data.size > 2) {
                data.text().then(t => {
                    // console.log(t);
                    const result = decodeRawMessage(t);

                    if (result) {
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