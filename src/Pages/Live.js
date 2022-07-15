import { useEffect, useState } from 'react';
import { StaticMap } from '../Components/StaticMap';
import { useTileMetadata } from '../hooks/useTileMetadata';
import { useSavedState } from '../hooks/useSavedState';
import { TileMapLayer } from '../Layers/TileMapLayer';
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
/* @ts-ignore */

const defaultLayers = [
  { name: "World", id: "world" ,visible: true },
  { name: "Tiles", id: "tiles", visible: true },
  { name: "Tides", id: "tides", visible: false },
  { name: "Debug", id: "debug", visible: false },
  { name: "AIS AisHub.net", id: "ahais", visible: false },
  { name: "AIS RTLSDR", id: "wsais", visible: true },
  { name: "AIS Combined", id: "ais", visible: true },
];

function Live () {
  const [ selectedLayers, setSelectedLayers ] = useSavedState("passagePlanner.selectedLayers", defaultLayers);
  // const [ bounds, setBounds ] = useSavedState("passagePlanner.bounds", [-180,-85.05,180,85.05]);
  const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
  const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);
  const [ time, setTime ] = useSavedState("passagePlanner.time", "09:00");
  const tideVectors = useTides(time);
  const [ animateTime, setAnimateTime ] = useState(false);
  const vesselsAH = useAHAIS(centre, zoom);
  const vesselsWS = useWSAIS();
  const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [ backgroundTileURL, setBackgroundTileURL ] = useSavedState("passagePlanner.backgroundUrl", "");
  const backgroundMetadata = useTileMetadata(backgroundTileURL);
  const basemapLayer = backgroundMetadata ? {
    layerType: "tiles",
    baseURL: backgroundTileURL,
    ...backgroundMetadata,
  } : null;

  useEffect(() => {
    if (animateTime) {
      const id = setInterval(() => {
        setTime(oldTime => {
          const [ h, m ] = oldTime.split(":");
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

  function handleSelectChange (e) {
    const newSelectedIDs = [...e.target.selectedOptions].map(option => option.value);
    setSelectedLayers(layers => {
      return layers.map(layer => ({ ...layer, visible: newSelectedIDs.includes(layer.id) }));
    });
  }

  const selectedLayersValues = selectedLayers.filter(l => l.visible).map(l => l.id);
  return (
    <div className="Live">
      <div className="Controls">
        <label>
          Background Tile URL
          <input value={backgroundTileURL} onChange={e => setBackgroundTileURL(e.target.value)} placeholder="https://" />
        </label>
        <label>
          Centre (
          <input type="number" value={centre[0]} onChange={e => setCentre(c => [+e.target.value, c[1]])} style={{width: 80}} />,
          <input type="number" value={centre[1]} onChange={e => setCentre(c => [c[0], +e.target.value])} style={{width: 80}} />)
        </label>
        <label>
          Zoom
          <input type="number" value={zoom} onChange={e => setZoom(+e.target.value)} style={{width: 80}} />
        </label>
        <label>
          Time
          <input value={time} onChange={e => setTime(e.target.value)} style={{width: 80}} />
        </label>
        <label>
          Animate
          <input type="checkbox" checked={animateTime} onChange={e => setAnimateTime(e.target.checked)} />
        </label>
        <label>
          Layers
          <ToggleSelect
            values={selectedLayersValues}
            onChange={values => setSelectedLayers(layers => layers.map(layer => ({ ...layer, visible: values.includes(layer.id) }))) }
            options={selectedLayers.map(layer => ({ value: layer.id, label: layer.name }))}
          />
          <select multiple onChange={handleSelectChange} value={selectedLayersValues} style={{width:180,height:180}}>
            {
              selectedLayers.map(layer => <option key={layer.id} value={layer.id}>{layer.name}</option>)
            }
          </select>
        </label>
        <AISKey />
      </div>
      <BasicMap onClick={(lon, lat) => setCentre([lon, lat])}>
        { selectedLayersValues.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} /> }
        { selectedLayersValues.includes("debug") && <DebugLayer /> }
        { selectedLayersValues.includes("ahais") && <AISLayerSVG vessels={vesselsAH} /> }
        { selectedLayersValues.includes("wsais") && <AISLayerSVG vessels={vesselsWS} /> }
        { selectedLayersValues.includes("ais") && <AISLayerSVG vessels={vessels} /> }
      </BasicMap>
    </div>
  );
}

export default Live;

