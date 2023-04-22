import { useEffect, useState } from 'react';
import { useSavedState } from '../hooks/useSavedState.js';
import { CanvasTileLayer } from '../Layers/CanvasTileLayer.js';
import { DebugLayer } from '../Layers/DebugLayer.js';
import { VectorFieldLayer } from '../Layers/VectorFieldLayer.js';
import { useAHAIS } from '../hooks/useAHAIS.js';
import { AISLayerSVG } from '../Layers/AISLayerSVG.js';
import { ToggleSelect } from '../Components/ToggleSelect.js';
import { AISKey } from '../Components/AISKey.js';
import { useWSAIS } from '../hooks/useWSAIS.js';
import { useTides } from '../hooks/useTides.js';
import { combineAIS } from '../util/ais.js';
import React from 'react';
import { LightLayer } from '../Layers/LightLayer.js';
import { useTileJSONList } from '../hooks/useTileJSONList.js';
import { formatDate, makeDateTime } from '../util/date.js';
import { AISLayerCanvas } from '../Layers/AISLayerCanvas.js';
import { VesselTable } from '../Components/VesselTable.js';
import { WeatherLayer } from '../Layers/WeatherLayer.js';
import { StaticMap } from '../Components/StaticMap.js';
import { WorldLayer } from '../Layers/WorldLayer.js';
import { ControlsLayer } from '../Layers/ControlsLayer.js';

const layers = [
  { name: "Tides", id: "tides" },
  { name: "Debug", id: "debug" },
  { name: "AIS AisHub.net", id: "ahais" },
  { name: "AIS RTLSDR", id: "wsais" },
  { name: "AIS RTLSDR (Canvas)", id: "wsais-canvas" },
  { name: "AIS Combined", id: "ais" },
  { name: "Lights", id: "lights" },
  { name: "Weather", id: "weather" },
  { name: "Weather Stations", id: "weather-stations" },
];

const defaultSelected = ["world", "tiles", "ais", "wsais"];

function Live() {
  const [selectedLayers, setSelectedLayers] = useSavedState("passagePlanner.selectedLayers", defaultSelected);
  // const [ bounds, setBounds ] = useSavedState("passagePlanner.bounds", [-180,-85.05,180,85.05]);
  const [centre, setCentre] = useSavedState("passagePlanner.centre", /** @type {[longitude: number, latitude: number]} */([0, 0]));
  const [zoom, setZoom] = useSavedState("passagePlanner.zoom", 4);
  const [date, setDate] = useState(() => formatDate());
  const [time, setTime] = useState(() => roundTime());
  const currentTime = makeDateTime(date, time);

  const tideVectors = useTides(currentTime);
  const [animateTime, setAnimateTime] = useState(false);

  const isAHAISActive = selectedLayers.includes("ahais") || selectedLayers.includes("ais");
  const isWSAISActive = selectedLayers.includes("wsais") || selectedLayers.includes("ais");
  const vesselsAH = useAHAIS(centre, isAHAISActive ? zoom : 0);
  const vesselsWS = useWSAIS(isWSAISActive);
  const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [tileLayerURLs, setTileLayerURLs] = useSavedState("passagePlanner.tileLayers", /** @type {string[]} */([]));
  const tileLayers = useTileJSONList(tileLayerURLs);
  const [selectedTileLayers, setSelectedTileLayers] = useSavedState("passagePlanner.selectedTileLayers", /** @type {string[]} */([]));

  const width = 1024;
  const height = 768;

  // const weatherMarkers = ALL_STATION_LOCATIONS.map(s => weather.find());
  // /** @type {import('../Layers/VectorFieldLayer.js').Field} */
  // const weatherMarkers = weatherForecast.map(f => ({
  //   lat: f.lat,
  //   lon: f.lon,
  //   direction: ((f.forecast?.ForecastWindDirection || 0) + 180) % 360,
  //   magnitude: (f.forecast?.ForecastWindSpeed || 0) * 0.2,
  // }));


  useEffect(() => {
    if (animateTime) {
      const id = setInterval(() => {
        setTime(oldTime => {
          const [h, m] = oldTime.split(":");
          let hours = +h;
          let minutes = +m;

          minutes += 15;

          if (minutes >= 60) {
            hours++;
            minutes = 0;
          }

          if (hours >= 24) {
            hours = 0;
          }

          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        });
      }, 1000);

      return () => clearInterval(id);
    }
  }, [animateTime, setTime]);

  function handleAddTileURL() {
    const newTileLayerURL = prompt("Enter new TileJSON url", "https://");
    if (newTileLayerURL) {
      setTileLayerURLs(urls => [...urls, newTileLayerURL]);
    }
  }

  return (
    <div className="Live">
      <div className="Controls">
        <label>
          Centre (
          <input type="number" value={centre[0]} onChange={e => setCentre(c => [+e.target.value, c[1]])} style={{ width: 80 }} />,
          <input type="number" value={centre[1]} onChange={e => setCentre(c => [c[0], +e.target.value])} style={{ width: 80 }} />)
        </label>
        <label>
          Zoom
          <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 120 }} />
        </label>
        <label>
          Time
          <input value={time} onChange={e => setTime(e.target.value)} style={{ width: 80 }} />
        </label>
        <label>
          Animate
          <input type="checkbox" checked={animateTime} onChange={e => setAnimateTime(e.target.checked)} />
        </label>
        <label>
          Layers
          <ToggleSelect
            values={selectedTileLayers}
            onChange={setSelectedTileLayers}
            options={tileLayerURLs.map((url, i) => ({ value: `${i}`, label: tileLayers[i] ? tileLayers[i].name : `Layer ${i}` }))}
          />
          <ToggleSelect
            values={selectedLayers}
            onChange={values => setSelectedLayers(values)}
            options={layers.map(layer => ({ value: layer.id, label: layer.name }))}
          />
          <button onClick={handleAddTileURL}>Add</button>
        </label>
        <AISKey />
      </div>
      <div>
        <StaticMap centre={centre} zoom={zoom} onClick={(lon, lat) => setCentre([lon, lat])} draggable width={width} height={height}>
          <WorldLayer />
          {
            tileLayers.map((layer, i) => selectedTileLayers.includes(`${i}`) && layer && <CanvasTileLayer key={i} layer={layer} />)
          }
          {selectedLayers.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} />}
          {selectedLayers.includes("debug") && <DebugLayer />}
          {selectedLayers.includes("lights") && <LightLayer />}
          {selectedLayers.includes("ahais") && <AISLayerSVG vessels={vesselsAH} fade />}
          {selectedLayers.includes("wsais") && <AISLayerSVG vessels={vesselsWS} fade showNames animation projectedTrack />}
          {selectedLayers.includes("wsais-canvas") && <AISLayerCanvas vessels={vesselsWS} />}
          {selectedLayers.includes("ais") && <AISLayerSVG vessels={vessels} fade showNames animation />}
          {selectedLayers.includes("weather") &&  <WeatherLayer time={currentTime} /> }
          {/* {selectedLayers.includes("weather-stations") &&  weatherMarkers && <VectorFieldLayer field={weatherMarkers} /> } */}
          <ControlsLayer setCentre={setCentre} setZoom={setZoom} />
        </StaticMap>
        {selectedLayers.includes("wsais") && <VesselTable vessels={vesselsWS} onClickLonLat={(lon, lat) => setCentre([lon, lat])} />}
      </div>
    </div>
  );
}

export default Live;

function roundTime (time = new Date(), minutes = 15) {
  const r = +time % (minutes * 60 * 1000);
  const d2 = new Date(+time - r);
  return `${d2.getHours().toString().padStart(2, "0")}:${d2.getMinutes().toString().padStart(2, "0")}`;
}
