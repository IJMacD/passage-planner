import React from "react";

/**
 * @param {object} props
 * @param {[number, number][]} props.values [theta in degrees, radius]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {number} [props.marker] Degrees
 * @param {string} [props.color] CSS Color
 * @param {(value: number) => string} [props.labelFn]
 */
export function PolarPlotSVG ({ values, width = 512, height = 512, marker = NaN, color = "#F00", labelFn }) {

    const canvasWidth = 512;
    const canvasHeight = 512;

    const demiWidth = canvasWidth / 2;
    const demiHeight = canvasHeight / 2;

    /**
     * @param {number} theta Degrees
     * @param {number} radius
     */
    function polar2xy (theta, radius) {
        const x = demiWidth + radius * Math.sin(theta/180*Math.PI);
        const y = demiHeight - radius * Math.cos(theta/180*Math.PI);
        return [x, y];
    }

    const radius = Math.min(demiWidth, demiHeight);

    const axialGridlines = [];

    // Axial lines
    for (let t = 0.25; t <= 1; t += 0.25) {
        axialGridlines.push(t);
    }

    const radialGridLinesPath = [];

    // Radial Lines
    for (let th = 0; th < 360; th += 45) {
        const [ x, y ] = polar2xy(th, radius);
        radialGridLinesPath.push(`M ${demiWidth} ${demiHeight} L ${x} ${y}`);
    }

    const maxVal = Math.max(...values.map(v => v[1]));
    const radialScale = radius / maxVal;

    const path = [];
    for (let i = 0; i < values.length; i++) {
        const [x, y] = polar2xy(values[i][0], values[i][1] * radialScale);
        path.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    path.push("Z");

    return (
        <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} style={{width,height}}>
            <path d={radialGridLinesPath.join(" ")} stroke="#999" />
            {
                axialGridlines.map(t => <circle key={t} cx={demiWidth} cy={demiHeight} r={t * radius} fill="none" stroke="#999" />)
            }
            {
                typeof labelFn === "function" && axialGridlines.map(t => {
                    const [ x, y ] = polar2xy(0, t * radius);
                    return <text key={t} x={x} y={y + 15} fill="#999">{labelFn(t * maxVal)}</text>;
                })
            }
            <path d={path.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="bevel" />
            {
                !isNaN(marker) && (() => {
                    const [x, y] = polar2xy(marker, radius);
                    return <path d={`M ${demiWidth} ${demiHeight} L ${x} ${y}`} stroke="#000" strokeWidth={2} strokeLinecap="round" />;
                })()
            }
        </svg>
    );
}