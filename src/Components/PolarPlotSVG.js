import React from "react";

/**
 * @param {object} props
 * @param {[number, number][]} props.values [theta in degrees, radius]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {number} [props.marker] Degrees
 * @param {number} [props.markerValue]
 * @param {string|((value: [number, number], index: number, values: [number, number][]) => string)} [props.color] CSS Color
 * @param {(value: number) => string} [props.labelFn]
 */
export function PolarPlotSVG ({ values, width = 512, height = 512, marker = NaN, markerValue = NaN, color = "#F00", labelFn }) {

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

    const paths = [];
    if (typeof color === "function") {
        for (let i = 1; i < values.length; i++) {
            const [x0, y0] = polar2xy(values[i-1][0], values[i-1][1] * radialScale);
            const [x1, y1] = polar2xy(values[i][0], values[i][1] * radialScale);
            const path = `M ${x0} ${y0} L ${x1} ${y1}`;
            paths.push({ path, color: color(values[i], i, values) });
        }
    }
    else {
        const path = [];
        for (let i = 0; i < values.length; i++) {
            const [x, y] = polar2xy(values[i][0], values[i][1] * radialScale);
            path.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
        }
        path.push("Z");

        paths.push({ path: path.join(" "), color });
    }

    return (
        <svg viewBox={`-0.5 -12.5 ${canvasWidth+1} ${canvasHeight+13}`} style={{width,height}}>
            <path d={radialGridLinesPath.join(" ")} stroke="#999" />
            {
                axialGridlines.map(t => {
                    const r = t * radius;
                    const [ x, y ] = polar2xy(0, r);
                    const [ x2, y2 ] = polar2xy(180, r);
                    return (
                        <React.Fragment key={t}>
                            <path id={`gridline-r${t}`} fill="none" stroke="#999" d={`M ${x} ${y} A ${r} ${r} 90 1 1 ${x2} ${y2} A ${r} ${r} 270 1 1 ${x} ${y}`} />
                            { typeof labelFn === "function" && <text key={t} fill="#999"><textPath href={`#gridline-r${t}`}>{labelFn(t * maxVal)}</textPath></text> }
                        </React.Fragment>
                    );
                })
            }
            {
                paths.map((p, i) => <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth={2} strokeLinecap="square" strokeLinejoin="bevel" />)
            }
            {
                !isNaN(marker) && (() => {
                    const [x, y] = polar2xy(marker, markerValue ? markerValue * radialScale : radius);
                    return <>
                        <path d={`M ${demiWidth} ${demiHeight} L ${x} ${y}`} stroke="#000" strokeWidth={2} strokeLinecap="round" />
                        { markerValue && <circle cx={x} cy={y} r={4} />}
                    </>;
                })()
            }
        </svg>
    );
}