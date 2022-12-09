import { useEffect, useState } from 'react';
import { useSavedState } from '../hooks/useSavedState';
import { CanvasTileLayer } from '../Layers/CanvasTileLayer';
import { DebugLayer } from '../Layers/DebugLayer';
import { VectorFieldLayer } from '../Layers/VectorFieldLayer';
import { useAHAIS } from '../hooks/useAHAIS';
import { AISLayerSVG } from '../Layers/AISLayerSVG';
import { ToggleSelect } from '../Components/ToggleSelect';
import { AISKey } from '../Components/AISKey';
import { useWSAIS } from '../hooks/useWSAIS';
import { useTides } from '../hooks/useTides';
import { combineAIS } from '../util/ais';
import { BasicMap } from '../Components/BasicMap';
import React from 'react';
import { LightLayer } from '../Layers/LightLayer';
import { useTileJSONList } from '../hooks/useTileJSONList';
import { formatDate, makeDateTime } from '../util/date';
import { ParticleLayer } from '../Layers/ParticleLayer';
import { useWeather } from '../hooks/useWeather';
import { findForecast } from '../util/weather';
/* @ts-ignore */

const layers = [
  { name: "Tides", id: "tides" },
  { name: "Debug", id: "debug" },
  { name: "AIS AisHub.net", id: "ahais" },
  { name: "AIS RTLSDR", id: "wsais" },
  { name: "AIS Combined", id: "ais" },
  { name: "Lights", id: "lights" },
  { name: "Weather", id: "weather" },
];

const defaultSelected = ["world", "tiles", "ais", "wsais"];

function Live() {
  const [selectedLayers, setSelectedLayers] = useSavedState("passagePlanner.selectedLayers", defaultSelected);
  // const [ bounds, setBounds ] = useSavedState("passagePlanner.bounds", [-180,-85.05,180,85.05]);
  const [centre, setCentre] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0, 0]));
  const [zoom, setZoom] = useSavedState("passagePlanner.zoom", 4);
  const [date, setDate] = useState(() => formatDate());
  const [time, setTime] = useState(() => roundTime());
  const currentTime = makeDateTime(date, time);

  const tideVectors = useTides(currentTime);
  const [animateTime, setAnimateTime] = useState(false);
  const vesselsAH = useAHAIS(centre, zoom);
  const vesselsWS = useWSAIS();
  const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [tileLayerURLs, setTileLayerURLs] = useSavedState("passagePlanner.tileLayers", /** @type {string[]} */([]));
  const tileLayers = useTileJSONList(tileLayerURLs);
  const [selectedTileLayers, setSelectedTileLayers] = useSavedState("passagePlanner.selectedTileLayers", /** @type {string[]} */([]));


  const weather = useWeather(centre);
  const weatherForecast = weather && findForecast(weather, currentTime);
  /** @type {[number,number]?} */
  const weatherVector = weatherForecast &&
      [
          weatherForecast.ForecastWindSpeed * -Math.sin(weatherForecast.ForecastWindDirection/180*Math.PI),
          weatherForecast.ForecastWindSpeed * Math.cos(weatherForecast.ForecastWindDirection/180*Math.PI)
      ];

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
      <BasicMap onClick={(lon, lat) => setCentre([lon, lat])}>
        {
          tileLayers.map((layer, i) => selectedTileLayers.includes(`${i}`) && layer && <CanvasTileLayer key={i} layer={layer} />)
        }
        {selectedLayers.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} />}
        {selectedLayers.includes("debug") && <DebugLayer />}
        {selectedLayers.includes("lights") && <LightLayer />}
        {selectedLayers.includes("ahais") && <AISLayerSVG vessels={vesselsAH} />}
        {selectedLayers.includes("wsais") && <AISLayerSVG vessels={vesselsWS} />}
        {selectedLayers.includes("ais") && <AISLayerSVG vessels={vessels} />}
        {selectedLayers.includes("weather") &&  weatherVector && <ParticleLayer vector={weatherVector} /> }
      </BasicMap>
    </div>
  );
}

export default Live;

function roundTime (time = new Date(), minutes = 15) {
  const r = +time % (minutes * 60 * 1000);
  const d2 = new Date(+time - r);
  return `${d2.getHours().toString().padStart(2, "0")}:${d2.getMinutes().toString().padStart(2, "0")}`;
}