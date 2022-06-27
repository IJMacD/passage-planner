import { useEffect, useState } from 'react';
import './App.css';
import { StaticMap } from './StaticMap';
import { useTileMetadata } from './useTileMetadata';
import { useSavedState } from './useSavedState';
import worldImageSrc from "./img/world.png";
import { useImage } from "./useImage";
import { TileMapLayer } from './Layers/TileMapLayer';
import { DebugLayer } from './Layers/DebugLayer';
import { ImageLayer } from './Layers/ImageLayer';
import { VectorFieldLayer } from './Layers/VectorFieldLayer';
import { useAHAIS } from './useAHAIS';
import { AISLayerSVG } from './Layers/AISLayerSVG';
import { ToggleSelect } from './ToggleSelect';
import { AISKey } from './AISKey';
import { useWSAIS } from './useWSAIS';
import { useTides } from './useTides';
import { combineAIS } from './ais';
import { lat2tile, lon2tile, tile2lat, tile2long } from './geo';
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

function App() {
  const [ backgroundTileURL, setBackgroundTileURL ] = useSavedState("passagePlanner.backgroundUrl", "");
  const [ selectedLayers, setSelectedLayers ] = useSavedState("passagePlanner.selectedLayers", defaultLayers);
  // const [ bounds, setBounds ] = useSavedState("passagePlanner.bounds", [-180,-85.05,180,85.05]);
  const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
  const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);
  const [ time, setTime ] = useSavedState("passagePlanner.time", "09:00");
  const backgroundMetadata = useTileMetadata(backgroundTileURL);
  const worldImage = useImage(worldImageSrc);
  const tideVectors = useTides(time);
  const [ animateTime, setAnimateTime ] = useState(false);
  const vesselsAH = useAHAIS(centre, zoom);
  const vesselsWS = useWSAIS();
  const vessels = combineAIS([vesselsAH, vesselsWS]);

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

  /**
   *
   * @param {number} dx Number of tiles to move horizontally
   * @param {number} dy Number of tiles to move vertically
   */
  function moveCentre (dx, dy) {
    setCentre(centre => {
      const tileX = lon2tile(centre[0], zoom);
      const tileY = lat2tile(centre[1], zoom);

      const lon = tile2long(tileX + dx, zoom);
      const lat = tile2lat(tileY + dy, zoom);

      return [lon, lat];
    });
  }

  const selectedLayersValues = selectedLayers.filter(l => l.visible).map(l => l.id);
  return (
    <div className="App">
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
        <button onClick={() => moveCentre(-1, 0)}>West</button>
        <button onClick={() => moveCentre(0, -1)}>North</button>
        <button onClick={() => moveCentre(0, 1.1)}>South</button>
        <button onClick={() => moveCentre(1, 0)}>East</button>
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
      <StaticMap centre={centre} zoom={zoom} onClick={(lon, lat) => setCentre([lon, lat])}>
        { selectedLayersValues.includes("world") && worldImage && <ImageLayer image={worldImage} bounds={[-180,-85.05,180,85.05]} /> }
        { selectedLayersValues.includes("tiles") && basemapLayer && <TileMapLayer layer={basemapLayer} /> }
        { selectedLayersValues.includes("tides") && tideVectors && <VectorFieldLayer field={tideVectors} /> }
        { selectedLayersValues.includes("debug") && <DebugLayer /> }
        { selectedLayersValues.includes("ahais") && <AISLayerSVG vessels={vesselsAH} /> }
        { selectedLayersValues.includes("wsais") && <AISLayerSVG vessels={vesselsWS} /> }
        { selectedLayersValues.includes("ais") && <AISLayerSVG vessels={vessels} /> }
      </StaticMap>
    </div>
  );
}

export default App;
