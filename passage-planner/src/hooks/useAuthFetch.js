import { useRef } from "react";

/**
 * @param {object} conf
 * @param {string} conf.exchangeURL
 * @param {string} conf.refreshToken
 */
export function useAuthFetch ({ exchangeURL, refreshToken }) {
    const accessTokenRef = useRef("");

    /**
     * @param {string} url
     * @param {RequestInit} [init]
     */
    async function authFetch(url, init) {
        init = makeInit(accessTokenRef.current, init);

        const r = await fetch(url, init);
        if (r.status === 401 || r.status === 403) {
            accessTokenRef.current = await getAccessToken(exchangeURL, refreshToken);
            init = makeInit(accessTokenRef.current, init);

            // Just retry once
            return fetch(url, init).then(r => {
                if (r.status === 401 || r.status === 403) {
                    // If it still fails, clear the token so that next time it will try to get a new one
                    accessTokenRef.current = "";

                    return Promise.reject(Error(`Refresh token is invalid or expired. Received status ${r.status} from ${url}`));
                }

                return r;
            });
        }

        return r;
    }

    return authFetch;
}

/**
 * @param {string} accessToken
 * @param {RequestInit} [init]
 */
function makeInit(accessToken, init) {
    if (!init) {
        init = {};
    }

    let { headers } = init;

    if (!headers) {
        headers = {};
        init.headers = headers;
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return init;
}

/**
 * @param {string} exchangeURL
 * @param {string} refreshToken
 * @return {Promise<string>}
 */
function getAccessToken (exchangeURL, refreshToken) {
    const body = new FormData();
    body.set("token", refreshToken);

    return fetch(exchangeURL, {
        method: "post",
        body
    }).then(r => r.json()).then(d => d.token);
}