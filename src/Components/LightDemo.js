import React, { useState } from "react";
import { LightFlasher } from "./LightFlasher";

export function LightDemo () {
    const [ specText, setSpecText ] = useState("");

    return (
        <div style={{backgroundColor:"#CCC"}}>
            <input value={specText} onChange={e => setSpecText(e.target.value)} placeholder="Spec" />
            <LightFlasher spec={specText} />
        </div>
    )
}