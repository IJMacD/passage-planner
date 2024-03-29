import React from "react";
import { LightDemo } from "../Components/LightDemo.jsx";
import { StaticMap } from "../Components/StaticMap.jsx";
import { useSavedState } from "../hooks/useSavedState.js";
import { useTileLayer } from "../hooks/useTileLayer.js";
import { CanvasTileLayer } from "../Layers/CanvasTileLayer.jsx";
import { DebugLayer } from "../Layers/DebugLayer.jsx";

function Test () {
    const [ centre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom ] = useSavedState("passagePlanner.zoom", 4);
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
