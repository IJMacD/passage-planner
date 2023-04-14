import React, { useMemo } from "react";
import { xy2LonLat } from "../util/projection";

/**
 * @typedef StaticMapContextValue
 * @prop {[number, number]} centre
 * @prop {number} zoom
 * @prop {number} width
 * @prop {number} height
 */

export const StaticMapContext = React.createContext({
    centre: /** @type {[number, number]} */([0, 0]),
    zoom: 8,
    width: 1024,
    height: 1024,
});

/**
 *
 * @param {object} props
 * @param {[number,number]} props.centre
 * @param {number} props.zoom
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {(lon: number, lat: number, e: import('react').MouseEvent) => void} [props.onClick]
 * @param {React.ReactChildren} [props.children]
 * @returns
 */
export function StaticMap ({ centre, zoom, width = 1024, height = 1024, onClick, children }) {

    /**
     * @param {import("react").MouseEvent<HTMLDivElement>} e
     */
    function handleClick (e) {
        if(onClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);

            const projection = xy2LonLat({ centre, zoom, width, height });
            const [ lon, lat ] = projection(x, y);

            onClick(lon, lat, e);
        }
    }

    const [ cx, cy ] = centre;

    const context = useMemo(() => {
        /** @type {[number, number]} */
        const centre = [ cx, cy ];
        return { centre, zoom, width, height };
    }, [ cx, cy, zoom, width, height ]);

    return (
        <div style={{ position: "relative", width, height, minWidth: width }} onClick={handleClick}>
            <StaticMapContext.Provider value={context}>
                { children }
            </StaticMapContext.Provider>
        </div>
    );
}
