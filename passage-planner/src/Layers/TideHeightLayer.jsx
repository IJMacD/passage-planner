import { useContext } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.jsx";
import { getBounds, lonLat2XY } from "../util/projection.js";
import { useTides } from "../hooks/useTides.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function TideHeightLayer({ time }) {
    const context = useContext(StaticMapContext);
    const projection = lonLat2XY(context);

    const [left, top] = useContext(DragContext);

    const bounds = getBounds(context);

    const tides = useTides(time, bounds);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top, left, lineHeight: 0, }}>
            {
                tides.map((tideStationRecord) => {
                    const [left, top] = projection(tideStationRecord.station.longitude, tideStationRecord.station.latitude);
                    return (
                        <TideMarker
                            key={tideStationRecord.station.code}
                            height={tideStationRecord.height}
                            dHeight={tideStationRecord.dHeight}
                            left={left}
                            top={top}
                            title={tideStationRecord.station.name}
                            svg
                        />
                    );
                })
            }
        </div>
    );
}

function TideMarker({ height, left, top, title = "", dHeight = NaN, svg = true }) {
    const outerWidth = 15;
    const outerHeight = 50;
    const padding = 2;
    const border = 1;

    const innerWidth = outerWidth - 2 * padding;
    const maxInnerHeight = outerHeight - padding * 2;

    // Highest Astronomical Tide
    // The highest Astronomical Tide (HAT) at the four stations ranges between +2.58 to +3.01
    const maxTideHeight = 3.01;

    const tideFraction = height / maxTideHeight;

    const innerHeight = tideFraction * maxInnerHeight;

    /**
     * @type {import("react").CSSProperties}
     */
    const labelStyle = {
        color: "red",
        fontSize: "0.8rem",
        fontWeight: "bold",
        position: "absolute",
        width: "max-content",
        textShadow: "0 0 4px rgb(255 255 255 / 80%)",
    }

    const heightText = height > 0 && `${height} m`;
    const heightChangeText = !isNaN(dHeight) && `${dHeight >= 0 ? "+" : "-"}${Math.abs(dHeight).toFixed(2)} m/h`;

    if (svg) {
        const height = 2 * (outerHeight + border);
        /** @type {import("react").CSSProperties} */
        const textStyle = { fontSize: 12, fill: "red", fontWeight: "bold", textShadow: "0 0 4px white" };

        return (
            <svg viewBox={`-50 ${-height / 2} 100 ${height}`} style={{ position: "absolute", top, left, transform: "translate(-50%, -50%)", width: 100, height }}>
                <circle r={1} />
                <rect x={-outerWidth / 2} y={-outerHeight} width={outerWidth} height={outerHeight} fill="white" stroke="black" strokeWidth={1} />
                <rect x={-innerWidth / 2} y={-innerHeight - padding} width={innerWidth} height={innerHeight} fill="red" />
                <text x={0} y={12} textAnchor="middle" style={textStyle}>{heightText}</text>
                <text x={0} y={24} textAnchor="middle" style={textStyle}>{heightChangeText}</text>
            </svg>
        );
    }

    return (
        <div style={{ boxSizing: "border-box", border: border + "px solid black", background: "white", position: "absolute", left: left - outerWidth / 2, top: top - outerHeight, width: outerWidth, height: outerHeight }} title={title}>
            <div style={{ boxSizing: "border-box", background: "red", position: "absolute", bottom: padding, left: padding, width: innerWidth - 2 * border, height: innerHeight }} />
            <p style={{ ...labelStyle, left: -outerWidth / 2, top: outerHeight - 5 }}>{heightText}</p>
            <p style={{ ...labelStyle, left: -outerWidth / 2 - 10, top: outerHeight + 5 }}>{heightChangeText}</p>
        </div>
    );
}

