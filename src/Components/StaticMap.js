import React, { useMemo, useRef, useState } from "react";
import { lonLat2XY, xy2LonLat } from "../util/projection.js";

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
 * @typedef {[dx: number, dy: number]} DragContextValue
 */

export const DragContext = React.createContext(/** @type {DragContextValue} */([0,0]));

/**
 *
 * @param {object} props
 * @param {[number,number]} props.centre
 * @param {number} props.zoom
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {(lon: number, lat: number, e: import('react').MouseEvent) => void} [props.onClick]
 * @param {React.ReactNode} [props.children]
 * @returns
 */
export function StaticMap ({ centre, zoom, width = 1024, height = 1024, onClick, children }) {
    const [ dragOffset, setDragOffset ] = useState(/** @type {DragContextValue} */([0,0]));

    const mouseDragStartRef = useRef(/** @type {[x: number, y: number]?} */(null))

    // /**
    //  * @param {import("react").MouseEvent<HTMLDivElement>} e
    //  */
    // function handleClick (e) {
    //     if(onClick) {
    //         const rect = e.currentTarget.getBoundingClientRect();
    //         const x = (e.clientX - rect.left);
    //         const y = (e.clientY - rect.top);

    //         const projection = xy2LonLat({ centre, zoom, width, height });
    //         const [ lon, lat ] = projection(x, y);

    //         onClick(lon, lat, e);
    //     }
    // }

    /**
     * @param {import("react").MouseEvent} e
     */
    function handleMouseDown (e) {
        mouseDragStartRef.current = [e.screenX,e.screenY];
    }

    /**
     * @param {import("react").MouseEvent} e
     */
    function handleMouseUp (e) {
        if(onClick && dragOffset) {
            const context = { centre, zoom, width, height };

            const projection = lonLat2XY(context);
            const [ cx, cy ] = projection(centre[0], centre[1]);

            const [ dx, dy ] = dragOffset;

            const reverseProjection = xy2LonLat(context);
            const [ lon, lat ] = reverseProjection(cx - dx, cy - dy);

            onClick(lon, lat, e);

            mouseDragStartRef.current = null;
            setDragOffset([0,0]);
        }
    }

    /**
     * @param {import("react").MouseEvent} e
     */
    function handleMouseMove (e) {
        const start = mouseDragStartRef.current;
        if (start) {
            const dx = e.screenX - start[0];
            const dy = e.screenY - start[1];
            setDragOffset([dx, dy]);
        }
    }

    const [ cx, cy ] = centre;

    const context = useMemo(() => {
        /** @type {[number, number]} */
        const centre = [ cx, cy ];
        return { centre, zoom, width, height };
    }, [ cx, cy, zoom, width, height ]);

    return (
        <div
            style={{ position: "relative", width, height, minWidth: width, overflow: "hidden" }}
            // onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            <DragContext.Provider value={dragOffset}>
                <StaticMapContext.Provider value={context}>
                    { children }
                </StaticMapContext.Provider>
            </DragContext.Provider>
            {/* {
                dragOffset && <p style={{position:"absolute"}}>dx: {dragOffset[0]} dy: {dragOffset[1]}</p>
            } */}
        </div>
    );
}
