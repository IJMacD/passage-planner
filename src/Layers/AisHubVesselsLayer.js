import React, { useContext } from "react";
import { AISLayerSVG } from "./AISLayerSVG.js";
import { StaticMapContext } from "../Components/StaticMap.js";
import { useAisHubVessels } from "../hooks/useAisHubVessels.js";

export function AisHubVesselsLayer () {
    const context = useContext(StaticMapContext);

    const vessels = useAisHubVessels(context);

    return <AISLayerSVG vessels={vessels} showNames fade animate />
}