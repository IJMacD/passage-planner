import React, { useEffect, useState } from "react";

const COLOUR_MAP = {
    W: "#FFF",
    R: "#F00",
    G: "#0F0",
    Bu: "#00F",
    Y: "#FF0",
    Or: "#F80",
};

const OFF_LIGHT = "transparent";

export function LightFlasher ({ spec, width = 32, height = 32 }) {
    const [ lightFill, setLightFill ]  = useState(OFF_LIGHT);


    function runCycle (on_period, period, groups, fillA, fillB) {
        const cycle = period / on_period;
        let counter = cycle;

        const id = setInterval(() => {
            counter--;
            const on = counter < groups * 2 && counter % 2 === 0;
            setLightFill(on ? fillA : fillB);
            if (counter <= 0) {
                counter = cycle;
            }
        }, on_period);

        setLightFill(fillB);

        return () => clearInterval(id);
    }

    useEffect(() => {
        const match = /^(F|Oc|Iso|Fl|Q|VQ|UQ)(?:\(([^)]+)\))?\.?(\s|W|R|G|Bu|Y|Or)\.?(?:(\d+)s)?\s?(?:(\d+)m)?\s?(?:(\d+)M)?/.exec(spec);

        if (match) {
            const [ _, mode, groupSpec, colour, seconds, elevation, distance ] = match;

            const fill = COLOUR_MAP[colour] || COLOUR_MAP.W;

            const period = (+seconds || 1) * 1000;

            const groups = +groupSpec || 1;

            if (mode === "F") {
                setLightFill(fill);
                return;
            }

            if (mode === "Iso") {
                const id = setInterval(() => {
                    setLightFill(lightFill => lightFill === fill ? OFF_LIGHT : fill);
                }, period);

                setLightFill(fill);

                return () => clearInterval(id);
            }

            if (mode === "Fl") {
                return runCycle(500, period, groups, fill, OFF_LIGHT);
            }

            if (mode === "Q") {
                return runCycle(100, period, groups, fill, OFF_LIGHT);
            }

            if (mode === "Oc") {
                return runCycle(500, period, groups, OFF_LIGHT, fill);
            }

            if (mode === "VQ") {
                return runCycle(100, period, groups, fill, OFF_LIGHT);
            }
        }

        setLightFill(OFF_LIGHT);

    }, [spec]);

    return (
        <svg viewBox="0 0 32 32" style={{width,height}}>
            <ellipse cx={16} cy={16} rx={16} ry={16} style={{fill:lightFill}} />
        </svg>
    );
}