import { useState, CSSProperties } from "react";
import { StaticMap } from "../Components/StaticMap";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer";

type ISOLocalDateString = string;

const ONE_HOUR = 60 * 60 * 1000;

export function Planner() {
  const [centre, setCentre] = useState([114.2, 22.3] as [number, number]);
  const [zoom, setZoom] = useState(14);
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

  const panelStyle: CSSProperties = {
    border: "1px solid #666",
    margin: 8,
  }

  const timeStyle: CSSProperties = {
    fontSize: "0.8em",
    fontWeight: "bold",
  };

  const timeFormatter = Intl.DateTimeFormat([], { timeStyle: "medium" });

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
          const time = new Date(+new Date(startTime) + i * panelDelta);

          return (
            <section style={panelStyle} key={i}>
              <span style={timeStyle}>{timeFormatter.format(time)}</span>
              <StaticMap
                centre={centre}
                zoom={zoom}
                width={400}
                height={300}
                onDragEnd={(lon, lat) => setCentre([lon, lat])}
                onDoubleClick={(lat, lon, e) => setZoom(z => e.ctrlKey ? z - 1 : z + 1)}
              >
                <HongKongMarineLayer />
              </StaticMap>
            </section>
          );
        })}
      </main>
    </div>
  )
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