import { useState } from "react";
import { StaticMap } from "./StaticMap";

export function SlippyMap({ children, ...restProps }: { children?: React.ReactNode }) {
    const [centre, setCentre] = useState<[longitude: number, latitude: number]>([114.2, 22.2]);
    const [zoom, setZoom] = useState(10);

    const onCentreChange = (newCentre: [number, number]) => {
        setCentre(newCentre);
    };

    const onZoomChange = (newZoom: number) => {
        setZoom(newZoom);
    };

    return (
        <StaticMap
            centre={centre}
            zoom={zoom}
            onDragEnd={(lon, lat) => { onCentreChange([lon, lat]); }}
            onDoubleClick={(lon, lat) => { onCentreChange([lon, lat]); onZoomChange(zoom + 1); }}
            width="100%"
            height={768}
            fullscreenButton
            {...restProps}
        >
            {children}
        </StaticMap>
    );
}