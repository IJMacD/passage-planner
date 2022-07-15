import { useEffect, useState } from "react";

/**
 *
 * @param {number[]} bounds
 */
export function useLights (bounds) {
    const [ lights, setLights ] = useState([]);

    const bbox = bounds.map(n => n.toFixed(3)).join(",");

    useEffect(() => {
        let active = true;

        fetch(`https://overpass-api.de/api/interpreter?data=[out:json][bbox];(node[%22seamark:light:character%22];);out;&bbox=${bbox}`)
            .then(r => r.json())
            .then(d => {
                if (active) {
                    const lights = d.elements.map(el => {
                        const char      = el.tags["seamark:light:character"];
                        const colour    = el.tags["seamark:light:colour"];
                        const height    = el.tags["seamark:light:height"];
                        const period    = el.tags["seamark:light:period"];
                        const range     = el.tags["seamark:light:range"];
                        const group     = el.tags["seamark:light:group"];

                        const spec = `${char}${group?`(${group})`:""}.${COLOUR_MAP[colour]}.${period}s${height}m${range}M`;

                        return { lon: el.lon, lat: el.lat, spec };
                    });

                    setLights(lights);
                }
            });

        return () => { active = false; };
    }, [bbox]);

    return lights;
}

const COLOUR_MAP = {
    "white":    "W",
    "red":      "R",
    "yellow":   "Y",
    "green":    "G",
    "blue":     "Bu",
    "orange":   "Or",
};