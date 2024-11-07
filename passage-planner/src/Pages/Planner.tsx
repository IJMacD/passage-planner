import { useState, CSSProperties } from "react";
import { StaticMap } from "../Components/StaticMap";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";
import { TideHeightLayer } from '../Layers/TideHeightLayer.jsx';
import { TidalCurrentVectorLayer } from "../Layers/TidalCurrentVectorLayer";

type Longitude = number;
type Latitude = number;
type Point = [Longitude, Latitude];
type ISOLocalDateString = string;

const ONE_HOUR = 60 * 60 * 1000;

export function Planner() {
  const [locations, setLocations] = useState([{ index: 0, centre: [114.2, 22.3] as Point, zoom: 14 }]);
  const [panelCount, setPanelCount] = useState(3);
  const [startTime, setStartTime] = useState(() => isoLocalDateTime());
  const [panelDelta, setPanelDelta] = useState(3 * ONE_HOUR);

  const plannerStyle: CSSProperties = {
    display: "flex",
    maxWidth: 1200,
    margin: "0 auto",
  };

  const sidebarStyle: CSSProperties = {
    maxWidth: 280,
  };

  const mainStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
  };

  return (
    <div style={plannerStyle}>
      <aside style={sidebarStyle}>
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        <input type="number" value={panelCount} onChange={e => setPanelCount(e.target.valueAsNumber)} />
        <select value={panelDelta} onChange={e => setPanelDelta(+e.target.value)}>
          <option value={0.5 * ONE_HOUR}>½ Hour</option>
          <option value={1 * ONE_HOUR}>1 Hour</option>
          <option value={2 * ONE_HOUR}>2 Hours</option>
          <option value={3 * ONE_HOUR}>3 Hours</option>
          <option value={4 * ONE_HOUR}>4 Hours</option>
          <option value={5 * ONE_HOUR}>5 Hours</option>
        </select>
      </aside>
      <main style={mainStyle}>
        {Array.from({ length: panelCount }).map((_, i) => {
          const location = findLast(locations, l => l.index <= i);
          const time = new Date(+new Date(startTime) + i * panelDelta);

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

          return <MapPanel key={i} location={location} time={time} setLocation={setLocation} clearLocation={(i === 0 || i === location.index) && clearLocation} />
        })}
      </main>
    </div>
  )
}

function MapPanel({ location, time, setLocation, clearLocation }: {
  location: { centre: Point, zoom: number },
  time: Date,
  setLocation: (location: { centre: Point, zoom: number }) => void,
  clearLocation: () => void
}) {
  const { centre, zoom } = location;

  const panelStyle: CSSProperties = {
    border: "1px solid #666",
    margin: 8,
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

  function handleDoubleClick(lon: Longitude, lat: Latitude, e: React.MouseEvent) {
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
        <HongKongMarineLayer />
        <TidalCurrentVectorLayer time={time} />
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