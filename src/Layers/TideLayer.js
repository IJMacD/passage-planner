import React, { useContext } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMap.js";
import { getBounds, lonLat2XY } from "../util/projection.js";
import { useTides } from "../hooks/useTides.js";

/**
 *
 * @param {object} props
 * @param {Date} props.time
 * @returns
 */
export function TideLayer ({ time }) {
    const context = useContext(StaticMapContext);
    const projection = lonLat2XY(context);

    const [left,top] = useContext(DragContext);

    const bounds = getBounds(context);

    const tides = useTides(time, bounds);

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top, left, lineHeight: 0, }}>
            {
                tides.map((tideStationRecord) => {
                    const [left, top] = projection(tideStationRecord.station.longitude, tideStationRecord.station.latitude);
                    return <TideMarker key={tideStationRecord.station.code} height={tideStationRecord.height} left={left} top={top} title={tideStationRecord.station.name} />
                })
            }
        </div>
    );
}

function TideMarker ({ height, left, top, title = "" }) {
    const outerWidth = 15;
    const outerHeight = 50;
    const padding = 2;
    const border = 1;

    const innerWidth = outerWidth - 2 * padding - 2 * border;
    const maxInnerHeight = outerHeight - padding * 2;

    const maxTideHeight = 2.5;

    const tideFraction = height / maxTideHeight;

    const innerHeight = tideFraction * maxInnerHeight;

    return (
        <div style={{boxSizing:"border-box",border:border+"px solid black",background:"white",position:"absolute",left:left-outerWidth/2,top:top-outerHeight,width: outerWidth,height: outerHeight}} title={title}>
            <div style={{boxSizing:"border-box",background:"red",position:"absolute",bottom:padding,left:padding,width:innerWidth,height:innerHeight}} />
            { height > 0 && <p style={{color:"red",fontSize:"0.8rem",fontWeight:"bold",position:"absolute",left:-outerWidth/2,top:outerHeight-5,width:"max-content"}}>{`${height} m`}</p> }
        </div>
    );
}

