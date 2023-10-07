import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lonLat2XY, xy2LonLat } from "../util/projection.js";
import { useFullscreen } from "../hooks/useFullscreen.js";

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
 * @param {number|string} [props.width]
 * @param {number} [props.height]
 * @param {(lon: number, lat: number, e: import('react').MouseEvent) => void} [props.onClick]
 * @param {(lon: number, lat: number, e: import('react').MouseEvent) => void} [props.onDoubleClick]
 * @param {React.ReactNode} [props.children]
 * @param {boolean} [props.draggable]
 * @returns
 */
export function StaticMap ({ centre, zoom, width = 1024, height = 1024, onClick, onDoubleClick, draggable=false, children }) {

    const [ actualWidth, setActualWidth ] = useState( typeof width === "number" ? width : 1024);
    const [ actualHeight, setActualHeight ] = useState(height);

    const [ dragOffset, setDragOffset ] = useState(/** @type {DragContextValue} */([0,0]));

    const mouseDragStartRef = useRef(/** @type {[x: number, y: number]?} */(null));

    /**
     * @param {import("react").MouseEvent<HTMLDivElement>} e
     */
    function handleClick (e) {
        if(onClick && !draggable) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);

            const projection = xy2LonLat({ centre, zoom, width: actualWidth, height: actualHeight });
            const [ lon, lat ] = projection(x, y);

            onClick(lon, lat, e);
        }
    }
    /**
     * @param {import("react").MouseEvent<HTMLDivElement>} e
     */
    function handleDoubleClick (e) {
        if(onDoubleClick) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);

            const projection = xy2LonLat({ centre, zoom, width: actualWidth, height: actualHeight });
            const [ lon, lat ] = projection(x, y);

            onDoubleClick(lon, lat, e);
        }
    }

    /**
     * @param {import("react").MouseEvent} e
     */
    function handleMouseDown (e) {
        if (onClick && draggable) {
            mouseDragStartRef.current = [e.screenX,e.screenY];
        }
    }

    /**
     * @param {import("react").MouseEvent} e
     */
    function handleMouseUp (e) {
        if(onClick && draggable) {
            const context = { centre, zoom, width: actualWidth, height: actualHeight };

            const projection = lonLat2XY(context);
            const [ cx, cy ] = projection(centre[0], centre[1]);

            const [ dx, dy ] = dragOffset;

            const reverseProjection = xy2LonLat(context);
            const [ lon, lat ] = reverseProjection(cx - dx, cy - dy);

            onClick(lon, lat, e);
        }

        setDragOffset([0,0]);

        mouseDragStartRef.current = null;
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
        /** @type {[lon: number, lat: number]} */
        const centre = [ cx, cy ];
        return { centre, zoom, width:actualWidth, height:actualHeight };
    }, [ cx, cy, zoom, actualWidth, actualHeight ]);

    /** @type {import("react").MutableRefObject<HTMLDivElement?>} */
    const mapRef = useRef(null);

    const updateSize = useCallback(() => {
        if (mapRef.current) {
            setActualWidth(mapRef.current.clientWidth);
            setActualHeight(mapRef.current.clientHeight);
        }
    }, []);

    useEffect(() => {
        const tid = setTimeout(updateSize, 100);
        const iid = setInterval(updateSize, 1000);

        return () => {
            clearTimeout(tid);
            clearInterval(iid);
        };
    }, [updateSize]);

    const [ isFullscreen, setIsFullscreen ] = useFullscreen(mapRef.current, updateSize);

    function toggleFullscreen () {
        setIsFullscreen(!isFullscreen);
    }

    return (
        <div
            style={{ position: "relative", width, height, overflow: "hidden", userSelect: "none" }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            ref={mapRef}
        >
            <DragContext.Provider value={dragOffset}>
                <StaticMapContext.Provider value={context}>
                    { children }
                </StaticMapContext.Provider>
            </DragContext.Provider>
            {/* dragOffset && <p style={{position:"absolute"}}>dx: {dragOffset[0]} dy: {dragOffset[1]}</p> */}
            <button style={{position:"absolute", right: 10, bottom: 10 }} onClick={toggleFullscreen}>{isFullscreen?"Exit Fullscreen":"Fullscreen"}</button>
        </div>
    );
}
