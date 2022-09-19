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
/* @ts-ignore */

const layers = [
  { name: "Tides", id: "tides" },
  { name: "Debug", id: "debug" },
  { name: "AIS AisHub.net", id: "ahais" },
  { name: "AIS RTLSDR", id: "wsais" },
  { name: "AIS Combined", id: "ais" },
  { name: "Lights", id: "lights" },
];

const defaultSelected = ["world", "tiles", "ais", "wsais"];

function Live() {
  const [selectedLayers, setSelectedLayers] = useSavedState("passagePlanner.selectedLayers", defaultSelected);
  // const [ bounds, setBounds ] = useSavedState("passagePlanner.bounds", [-180,-85.05,180,85.05]);
  const [centre, setCentre] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0, 0]));
  const [zoom, setZoom] = useSavedState("passagePlanner.zoom", 4);
  const [time, setTime] = useSavedState("passagePlanner.time", "09:00");
  const tideVectors = useTides(time);
  const [animateTime, setAnimateTime] = useState(false);
  const vesselsAH = useAHAIS(centre, zoom);
  const vesselsWS = useWSAIS();
  const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [newTileLayerURL, setNewTileLayerURL] = useState("");
  const [tileLayerURLs, setTileLayerURLs] = useSavedState("passagePlanner.tileLayers", /** @type {string[]} */([]));
  const tileLayers = useTileJSONList(tileLayerURLs);
  const [selectedTileLayers, setSelectedTileLayers] = useState(/** @type {string[]} */([]));

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
    setTileLayerURLs(urls => [...urls, newTileLayerURL]);
    setNewTileLayerURL("");
  }

  return (
    <div className="Live">
      <div className="Controls">
        <label>
          TileJSON URL
          <input value={newTileLayerURL} onChange={e => setNewTileLayerURL(e.target.value)} placeholder="https://" />
        </label>
        <button onClick={handleAddTileURL}>Add</button>
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
            options={tileLayers.filter(m => m).map((layer, i) => ({ value: `${i}`, label: layer.name }))}
          />
          <ToggleSelect
            values={selectedLayers}
            onChange={values => setSelectedLayers(values)}
            options={layers.map(layer => ({ value: layer.id, label: layer.name }))}
          />
        </label>
        <AISKey />
      </div>
      <BasicMap onClick={(lon, lat) => setCentre([lon, lat])}>
        {
          tileLayers.map((layer, i) => selectedTileLayers.includes(`${i}`) && layer && <CanvasTileLayer key={i} layer={layer} />)
        }
        {selectedLayers.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} />}
        {selectedLayers.includes("debug") && <DebugLayer />}
        {selectedLayers.includes("ahais") && <AISLayerSVG vessels={vesselsAH} />}
        {selectedLayers.includes("wsais") && <AISLayerSVG vessels={vesselsWS} />}
        {selectedLayers.includes("ais") && <AISLayerSVG vessels={vessels} />}
        {selectedLayers.includes("lights") && <LightLayer />}
      </BasicMap>
    </div>
  );
}

export default Live;

