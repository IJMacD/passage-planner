import React, { useEffect } from "react";
import { LightDemo } from "../Components/LightDemo";
import { StaticMap } from "../Components/StaticMap";
import { useSavedState } from "../hooks/useSavedState";
import { useTileLayer } from "../hooks/useTileLayer";
import { CanvasTileLayer } from "../Layers/CanvasTileLayer";
import { DebugLayer } from "../Layers/DebugLayer";

function Test () {
    const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);
    const basemapLayer = useTileLayer(localStorage.getItem("passagePlanner.backgroundUrl"));

    return (
        <div style={{padding: "1em"}}>
            <h1>Test</h1>

            <div style={{display:"flex"}}>
                <div>
                    <LightDemo />

                </div>
                <StaticMap centre={centre} zoom={zoom} width={500} height={500} >
                    { basemapLayer && <CanvasTileLayer layer={basemapLayer} /> }
                    <DebugLayer />
                </StaticMap>
            </div>

        </div>
    )
}

export default Test;
