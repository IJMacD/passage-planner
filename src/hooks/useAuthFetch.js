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
    function authFetch (url, init) {
        init = makeInit(accessTokenRef.current, init);

        return fetch(url, init).then(async r => {
            if (r.status === 401 || r.status === 403) {
                accessTokenRef.current = await getAccessToken(exchangeURL, refreshToken);
                init = makeInit(accessTokenRef.current, init);

                // Just retry once
                return fetch(url, init);
            }

            return r;
        });
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