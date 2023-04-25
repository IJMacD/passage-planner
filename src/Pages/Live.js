import { useEffect, useState } from 'react';
import { useSavedState } from '../hooks/useSavedState.js';
import { CanvasTileLayer } from '../Layers/CanvasTileLayer.js';
import { DebugLayer } from '../Layers/DebugLayer.js';
import { VectorFieldLayer } from '../Layers/VectorFieldLayer.js';
import { AISLayerSVG } from '../Layers/AISLayerSVG.js';
import { ToggleSelect } from '../Components/ToggleSelect.js';
import { AISKey } from '../Components/AISKey.js';
import { useWebsocketVessels } from '../hooks/useWebsocketVessels.js';
import { useTides } from '../hooks/useTides.js';
// import { combineAIS } from '../util/ais/ais.js';
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
import { LatLonGridLayer } from '../Layers/LatLonGridLayer.js';
import { AisHubVesselsLayer } from '../Layers/AisHubVesselsLayer.js';

const layers = [
  { name: "Tides", id: "tides" },
  { name: "Grid", id: "grid" },
  { name: "Debug", id: "debug" },
  { name: "AIS AisHub.net", id: "ahais" },
  { name: "AIS RTLSDR", id: "wsais" },
  { name: "AIS RTLSDR (Canvas)", id: "wsais-canvas" },
  // { name: "AIS Combined", id: "ais" },
  { name: "Lights", id: "lights" },
  { name: "Weather", id: "weather" },
  // { name: "Weather Stations", id: "weather-stations" },
];

const defaultSelected = ["world", "tiles", "ais", "wsais"];

const osmTileJSON = "https://raw.githubusercontent.com/mapbox/tilejson-spec/master/2.2.0/example/osm.layer";

function Live() {
  const [selectedLayers, setSelectedLayers] = useSavedState("passagePlanner.selectedLayers", defaultSelected);
  const [centre, setCentre] = useSavedState("passagePlanner.centre", /** @type {[longitude: number, latitude: number]} */([114.2, 22.2]));
  const [zoom, setZoom] = useSavedState("passagePlanner.zoom", 10);
  const [date, setDate] = useState(() => formatDate());
  const [time, setTime] = useState(() => roundTime());
  const currentTime = makeDateTime(date, time);

  const tideVectors = useTides(currentTime);
  const [animateTime, setAnimateTime] = useState(false);

  const isWSAISActive = selectedLayers.includes("wsais") || selectedLayers.includes("ais");
  const vesselsWS = useWebsocketVessels(isWSAISActive);
  // const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [tileLayerURLs, setTileLayerURLs] = useSavedState("passagePlanner.tileLayers", [osmTileJSON]);
  const tileLayers = useTileJSONList(tileLayerURLs);
  const [selectedTileLayers, setSelectedTileLayers] = useSavedState("passagePlanner.selectedTileLayers", [osmTileJSON]);

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
        <label>Layers</label>
        <button onClick={handleAddTileURL}>Add</button>
          <ToggleSelect
            values={selectedTileLayers}
            onChange={setSelectedTileLayers}
            options={tileLayerURLs.map((url, i) => ({ value: `${i}`, label: tileLayers[i] ? tileLayers[i].name : `Layer ${i}` }))}
          onRemove={i => setTileLayerURLs(urls => [ ...urls.slice(0, i), ...urls.slice(i + 1) ])}
          />
          <ToggleSelect
            values={selectedLayers}
            onChange={values => setSelectedLayers(values)}
            options={layers.map(layer => ({ value: layer.id, label: layer.name }))}
          />
        <AISKey />
      </div>
      <div style={{flex: 1}}>
        <StaticMap centre={centre} zoom={zoom} onClick={(lon, lat) => setCentre([lon, lat])} draggable width="100%" height={768}>
          <WorldLayer />
          {
            tileLayers.map((layer, i) => selectedTileLayers.includes(`${i}`) && layer && <CanvasTileLayer key={i} layer={layer} />)
          }
          {selectedLayers.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} />}
          {selectedLayers.includes("grid") && <LatLonGridLayer />}
          {selectedLayers.includes("debug") && <DebugLayer />}
          {selectedLayers.includes("lights") && <LightLayer />}
          {selectedLayers.includes("ahais") && <AisHubVesselsLayer />}
          {selectedLayers.includes("wsais") && <AISLayerSVG vessels={vesselsWS} fade showNames animate projectTrack />}
          {selectedLayers.includes("wsais-canvas") && <AISLayerCanvas vessels={vesselsWS} />}
          {/* {selectedLayers.includes("ais") && <AISLayerSVG vessels={vessels} fade showNames animation />} */}
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
