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

/**
 *
 * @param {object} props
 * @param {string} props.spec
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {number} [props.fullOpacity]
 * @returns
 */
export function LightFlasher ({ spec, x, y, width, height, fullOpacity = 1 }) {
    const [ lightStatus, setLightStatus ]  = useState(false);

    const match = /^(F|Oc|Iso|Fl|Q|VQ|UQ)(?:\(([^)]+)\))?\.?(\s|W|R|G|Bu|Y|Or)\.?(?:(\d+)s)?\s?(?:(\d+)m)?\s?(?:(\d+)M)?/.exec(spec);

    const [ _, mode, groupSpec, colour, seconds, elevation, range = 1 ] = match || [];

    const fill = COLOUR_MAP[colour] || COLOUR_MAP.W;

    const stroke = fill === COLOUR_MAP.W ? "#000" : (void 0);

    // Helper function
    function runCycle (on_period, period, groups, stateA, stateB) {
        const cycle = period / on_period;
        let counter = cycle;

        const id = setInterval(() => {
            counter--;
            const on = counter < groups * 2 && counter % 2 === 0;
            setLightStatus(on ? stateA : stateB);
            if (counter <= 0) {
                counter = cycle;
            }
        }, on_period);

        setLightStatus(stateB);

        return () => clearInterval(id);
    }

    useEffect(() => {

        if (match) {

            const period = (+seconds || 1) * 1000;

            const groups = +groupSpec || 1;

            if (mode === "F") {
                setLightStatus(true);
                return;
            }

            if (mode === "Iso") {
                const id = setInterval(() => {
                    setLightStatus(status => !status);
                }, period / 2);

                setLightStatus(true);

                return () => clearInterval(id);
            }

            if (mode === "Fl") {
                return runCycle(500, period, groups, true, false);
            }

            if (mode === "Q") {
                return runCycle(100, period, groups, true, false);
            }

            if (mode === "Oc") {
                return runCycle(500, period, groups, false, true);
            }

            if (mode === "VQ") {
                return runCycle(100, period, groups, true, false);
            }
        }

        setLightStatus(false);

    }, [spec]);

    const size = (Math.log2(+range * 10) * 5) || 32;

    if (!width) {
        width = size;
    }

    if (!height) {
        height = size;
    }

    const left = x - width / 2;
    const top = y - height / 2;

    const opacity = lightStatus ? fullOpacity : 0;

    return (
        <svg viewBox="0 0 32 32" style={{width,height,position:"absolute",top,left}}>
            <ellipse cx={16} cy={16} rx={16} ry={16} style={{fill,opacity,transition:"opacity 0.2s",stroke}} />
        </svg>
    );
}