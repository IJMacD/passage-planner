import React from "react";

export const StaticMapContext = React.createContext({
    centre: [0, 0],
    zoom: 8,
    width: 1024,
    height: 1024,
});

export function StaticMap ({ centre, zoom, onClick, children }) {
    const width = 1024;
    const height = 1024;

    return (
        <div style={{ position: "relative", width, height, minWidth: width }}>
            <StaticMapContext.Provider value={{ centre, zoom, width, height }}>
                { children }
            </StaticMapContext.Provider>
        </div>
    );
}
