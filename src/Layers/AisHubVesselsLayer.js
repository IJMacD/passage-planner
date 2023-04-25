import React, { useContext } from "react";
import { AISLayerSVG } from "./AISLayerSVG.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import { useAisHubVessels } from "../hooks/useAisHubVessels.js";

/**
 * @param {JSX.IntrinsicAttributes & { showNames?: boolean; fade?: boolean; projectTrack?: boolean; animate?: boolean; }} props
 */
export function AisHubVesselsLayer (props) {
    const context = useContext(StaticMapContext);

    const vessels = useAisHubVessels(context);

    return <AISLayerSVG vessels={vessels} fade {...props} />
}