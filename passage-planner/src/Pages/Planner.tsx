import { useState, CSSProperties } from "react";
import { StaticMap } from "../Components/StaticMap.jsx";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";
import { TideHeightLayer } from '../Layers/TideHeightLayer.jsx';
import { TidalCurrentVectorLayer } from "../Layers/TidalCurrentVectorLayer";
import { VectorFieldLayer } from "../Layers/VectorFieldLayer";
import { useSavedState } from "../hooks/useSavedState";
import { WeatherBarbLayer } from "../Layers/WeatherBarbLayer";

import "./Planner.scss";

type Longitude = number;
type Latitude = number;
type Point = [Longitude, Latitude];
type ISOLocalDateString = string;

const ONE_HOUR = 60 * 60 * 1000;

const keyField = [
  { lon: -0.015, lat: 0.011, magnitude: 0.1, direction: 0 },
  { lon: -0.015, lat: 0.009, magnitude: 0.2, direction: 0 },
  { lon: -0.015, lat: 0.006, magnitude: 0.3, direction: 0 },
  { lon: -0.015, lat: 0.002, magnitude: 0.5, direction: 0 },
  { lon: -0.015, lat: -0.002, magnitude: 0.7, direction: 0 },
  { lon: -0.015, lat: -0.006, magnitude: 0.9, direction: 0 },
  { lon: -0.015, lat: -0.010, magnitude: 1.1, direction: 0 },
];

export function Planner() {
  const [locations, setLocations] = useSavedState("planner.locations", [{ index: 0, centre: [114.2, 22.3] as Point, zoom: 14 }]);
  const [panelCount, setPanelCount] = useSavedState("planner.panelCount", 3);
  const [startTime, setStartTime] = useSavedState("planner.startTime", () => isoLocalDateTime());
  const [panelDelta, setPanelDelta] = useSavedState("planner.panelDelta", 3 * ONE_HOUR);
  const [saturation, setSaturation] = useState(1);
  const [showKey, setShowKey] = useState(false);
  const [interpolate, setInterpolate] = useState(false);

  const labelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    fontWeight: "bold",
    marginBottom: 8,
  };

  const miniLabelStyle: CSSProperties = {
    ...labelStyle,
    display: "block",
  };

  return (
    <div className="Planner">
      <aside>
        <label style={labelStyle}>
          Start Date
          <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </label>
        <label style={labelStyle}>
          Number of Panels
          <input type="number" value={panelCount} onChange={e => setPanelCount(e.target.valueAsNumber)} />
        </label>
        <label style={labelStyle}>
          Gap between Panels
          <select value={panelDelta} onChange={e => setPanelDelta(+e.target.value)}>
            <option value={0.5 * ONE_HOUR}>½ Hour</option>
            <option value={1 * ONE_HOUR}>1 Hour</option>
            <option value={2 * ONE_HOUR}>2 Hours</option>
            <option value={3 * ONE_HOUR}>3 Hours</option>
            <option value={4 * ONE_HOUR}>4 Hours</option>
            <option value={5 * ONE_HOUR}>5 Hours</option>
          </select>
        </label>
        <label style={labelStyle}>
          Base Map Saturation
          <select value={saturation} onChange={e => setSaturation(+e.target.value)}>
            <option value="2">Oversaturate</option>
            <option value="1">Normal</option>
            <option value="0.5">Desaturate</option>
            <option value="0">Greyscale</option>
          </select>
        </label>
        <label style={miniLabelStyle}>
          <input type="checkbox" checked={showKey} onChange={e => setShowKey(e.target.checked)} />
          Show Key
        </label>
        <label style={miniLabelStyle}>
          <input type="checkbox" checked={interpolate} onChange={e => setInterpolate(e.target.checked)} />
          Interpolate locations
        </label>
      </aside>
      <main>
        {Array.from({ length: panelCount }).map((_, i) => {
          const time = new Date(+new Date(startTime) + i * panelDelta);
          const location: { centre: Point, zoom: number, index?: number }|undefined = interpolate ?
            interpolateLocation(locations, i) :
            findLast(locations, l => l.index <= i);

          function setLocation(location?: { centre: Point, zoom: number }) {
            setLocations(locations => {
              const before = locations.filter(l => l.index < i);
              const after = locations.filter(l => l.index > i);

              return location ? [
                ...before,
                { index: i, ...location },
                ...after
              ] : [
                ...before,
                ...after
              ];
            });
          }

          function clearLocation() {
            if (i === 0) {
              // We can never remove the first point
              return;
            }

            setLocation();
          }

          if (!location) {
            return null;
          }

          return <MapPanel
            key={i}
            location={location}
            time={time}
            setLocation={setLocation}
            clearLocation={(i === 0 || i === location.index) ? clearLocation : () => void 0}
            saturation={saturation}
          />
        })}
        {showKey &&
          <section style={{ border: "1px solid #666", margin: 8 }}>
            <span style={{ fontSize: "0.8em", fontWeight: "bold", }}> Key</span>
            <StaticMap
              centre={[0, 0]}
              zoom={14}
              width={400}
              height={300}
            >
              <VectorFieldLayer field={keyField} outline />
            </StaticMap>
          </section>
        }
      </main>
    </div>
  )
}

function MapPanel({ location, time, setLocation, clearLocation, saturation = 1 }: {
  location: { centre: Point, zoom: number },
  time: Date,
  setLocation: (location: { centre: Point, zoom: number }) => void,
  clearLocation: () => void,
  saturation?: number,
}) {
  if (isNaN(+time)) {
    return null;
  }

  const { centre, zoom } = location;

  const panelStyle: CSSProperties = {
    border: "1px solid #666",
    margin: 8,
    lineHeight: 1,
  }

  const timeStyle: CSSProperties = {
    fontSize: "0.8em",
    fontWeight: "bold",
  };

  const pinnedLocationStyle: CSSProperties = {
    cursor: "pointer",
  };

  const timeFormatter = Intl.DateTimeFormat([], { timeStyle: "medium" });

  function handleDragEnd(lon: Longitude, lat: Latitude) {
    setLocation({ centre: [lon, lat], zoom });
  }

  function handleDoubleClick(_lon: Longitude, _lat: Latitude, e: React.MouseEvent) {
    setLocation({ centre, zoom: (e.ctrlKey || e.metaKey) ? zoom - 1 : zoom + 1 });
  }

  return (
    <section style={panelStyle}>
      <span style={timeStyle}>{timeFormatter.format(time)}</span>
      {clearLocation && <span style={pinnedLocationStyle} onClick={clearLocation}>•</span>}
      <StaticMap
        centre={centre}
        zoom={zoom}
        width={400}
        height={300}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
      >
        <HongKongMarineLayer style={{ filter: saturation === 1 ? "" : `saturate(${saturation})` }} />
        <TidalCurrentVectorLayer time={time} outline />
        <WeatherBarbLayer time={time} outline />
        <TideHeightLayer time={time} />
      </StaticMap>
    </section>
  );
}

function p2(n: number) {
  return String(n).padStart(2, "0");
}

function isoLocalDateTime(date = new Date()): ISOLocalDateString {
  return `${date.getFullYear()
    }-${p2(date.getMonth() + 1)
    }-${p2(date.getDate())
    }T${p2(date.getHours())
    }:${p2(date.getMinutes())
    }:${p2(date.getSeconds())
    }`;
}

function findLast<T>(array: T[], callback: (element: T) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (callback(array[i])) {
      return array[i];
    }
  }

  return undefined;
}

function interpolateLocation (locations: { index: number; centre: Point; zoom: number; }[], index: number): {
  centre: Point,
  zoom: number
} | undefined {
  const found = locations.find(l => l.index === index);
  if (found) {
    return found;
  }

  const prevLocation = findLast(locations, l => l.index < index);
  const nextLocation = locations.find(l => l.index > index);

  if (!prevLocation) {
    return;
  }

  if (!nextLocation) {
    return prevLocation;
  }

  const fraction = (index - prevLocation.index) / (nextLocation.index - prevLocation.index);

  const lon0 = prevLocation.centre[0];
  const lat0 = prevLocation.centre[1];
  const zoom0 = prevLocation.zoom;

  const dLon = nextLocation.centre[0] - lon0;
  const dLat = nextLocation.centre[1] - lat0;
  const dZoom = nextLocation.zoom - zoom0;

  const lon = lon0 + fraction * dLon;
  const lat = lat0 + fraction * dLat;
  const zoom = zoom0 + fraction * dZoom;

  return { centre: [lon, lat], zoom };
}