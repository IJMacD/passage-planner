import { useEffect, useState } from 'react';
import { useSavedState } from '../hooks/useSavedState.js';
import { CanvasTileLayer } from '../Layers/CanvasTileLayer.js';
import { DebugLayer } from '../Layers/DebugLayer.js';
import { VectorFieldLayer } from '../Layers/VectorFieldLayer.js';
import { AISLayerSVG } from '../Layers/AISLayerSVG.js';
import { ToggleSelect } from '../Components/ToggleSelect.js';
import { AISKey } from '../Components/AISKey.js';
import { useWebsocketVessels } from '../hooks/useWebsocketVessels.js';
import { useTidalCurrents } from '../hooks/useTidalCurrents.js';
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
import { CurrentParticleLayer } from '../Layers/CurrentParticleLayer.js';
import { WeatherStationsLayer } from '../Layers/WeatherStationsLayer.js';
import { TideHeightLayer } from '../Layers/TideHeightLayer.js';
import { WeatherGradientLayer } from '../Layers/WeatherGradientLayer.js';

const layers = [
  { name: "Grid", id: "grid" },
  { name: "Currents", id: "currents" },
  { name: "Currents (Particles)", id: "currents-particles" },
  { name: "Debug", id: "debug" },
  { name: "AIS AisHub.net", id: "ahais" },
  { name: "AIS RTLSDR (SVG)", id: "wsais" },
  { name: "AIS RTLSDR (Canvas)", id: "wsais-canvas" },
  // { name: "AIS Combined", id: "ais" },
  { name: "Lights", id: "lights" },
  { name: "Weather Gradient", id: "weather-gradient" },
  { name: "Weather", id: "weather" },
  { name: "Weather Stations", id: "weather-stations" },
  { name: "Tide Heights", id: "tides" },
];

const defaultSelected = ["world", "wsais"];

const osmTileJSON = "https://raw.githubusercontent.com/mapbox/tilejson-spec/master/2.2.0/example/osm.layer";

function Live() {
  const [selectedLayers, setSelectedLayers] = useSavedState("passagePlanner.selectedLayers", defaultSelected);
  const [centre, setCentre] = useSavedState("passagePlanner.centre", /** @type {[longitude: number, latitude: number]} */([114.2, 22.2]));
  const [zoom, setZoom] = useSavedState("passagePlanner.zoom", 10);
  const [date, setDate] = useState(() => formatDate());
  const [time, setTime] = useState(() => roundTime());
  const [lockNow, setLockNow] = useState(true);
  const currentTime = makeDateTime(date, time);

  const tideVectors = useTidalCurrents(currentTime);
  const [animateTime, setAnimateTime] = useState(false);
  const [animateDate, setAnimateDate] = useState(false);

  const isWSAISActive = selectedLayers.includes("wsais") || selectedLayers.includes("ais");
  const vesselsWS = useWebsocketVessels(isWSAISActive);
  // const vessels = combineAIS([vesselsAH, vesselsWS]);

  const [tileLayerURLs, setTileLayerURLs] = useSavedState("passagePlanner.tileLayers", [osmTileJSON]);
  const tileLayers = useTileJSONList(tileLayerURLs);
  const [selectedTileLayers, setSelectedTileLayers] = useSavedState("passagePlanner.selectedTileLayers", [osmTileJSON]);

  const [ showVesselNames, setShowVesselNames ] = useSavedState("passagePlanner.showNames", false);
  const [ showVesselPredictedTrack, setShowVesselPredictedTrack ] = useSavedState("passagePlanner.predictedTrack", false);
  const [ showVesselAnimation, setShowVesselAnimation ] = useSavedState("passagePlanner.animate", false);

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

            if (animateDate) {
              setDate(date => {
                const d = new Date(`${date}T00:00:00`);
                return formatDate(new Date(+d + 86400000));
              });
            }
          }

          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        });
      }, 1000);

      return () => clearInterval(id);
    }
  }, [animateTime, animateDate]);

  const nowTime = roundTime(new Date());
  useEffect(() => {
    if (lockNow) {
      setTime(nowTime);
    }
  }, [lockNow, nowTime])

  function handleAddTileURL() {
    const newTileLayerURL = prompt("Enter new TileJSON url", "https://");
    if (newTileLayerURL) {
      setTileLayerURLs(urls => [...urls, newTileLayerURL]);
    }
  }

  // Up means up in the layer stack, to appear above other layers.
  // Layers are drawn in array order with index 0 being at bottom.
  // This means to move layers up it must move later in the array.
  /**
   * @param {string} url
   */
  function handleMoveTileLayerUp (url) {
    setTileLayerURLs(tileLayerURLs => {
      const index = tileLayerURLs.indexOf(url);

      if (index < 0 || index >= tileLayerURLs.length - 1) {
        return tileLayerURLs;
      }

      const urls = [...tileLayerURLs];

      const tmp = urls[index];
      urls[index] = urls[index + 1];
      urls[index + 1] = tmp;

      return urls;
    });
  }

  /**
   * @param {import('react').MouseEvent<HTMLButtonElement>} e
   */
  function handleNowButton (e) {
    e.stopPropagation();
    setDate(formatDate());
    setTime(roundTime());
    setAnimateTime(false);
    setLockNow(true);
  }

  function handleTimeSliderChange (e) {
    setTime(minutesToTime(+e.target.value));
    setLockNow(false);
  }
  function handleTimeChange (e) {
    setTime(e.target.value);
    setLockNow(false);
  }
  function handleDateChange (e) {
    setDate(e.target.value);
    setLockNow(false);
  }
  function handleAnimateTimeChange (e) {
    setAnimateTime(e.target.checked);
    setLockNow(false);
  }
  function handleAnimateDateChange (e) {
    setAnimateDate(e.target.checked);
    setLockNow(false);
  }

  const isLive = date === formatDate() && time === roundTime();

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
          <input type="date" value={date} onChange={handleDateChange} style={{ width: 120 }} />
        </label>
        <label>
          Time
          <input value={time} onChange={handleTimeChange} style={{ width: 80 }} />
          <button onClick={handleNowButton} disabled={isLive}>Now</button>
          { lockNow && <span>🔒</span> }
        </label>
        <input type="range" value={timeToMinutes(time)} min={0} max={24 * 60} onChange={handleTimeSliderChange} style={{width:"100%"}} />
        <div>
          <label style={{display:"inline"}}>
            Animate Time
            <input type="checkbox" checked={animateTime} onChange={handleAnimateTimeChange} />
          </label>
          <label style={{display:"inline"}}>
            Animate Date
            <input type="checkbox" checked={animateDate} onChange={handleAnimateDateChange} disabled={!animateTime} />
         </label>
        </div>
        <label>Layers</label>
        <ToggleSelect
          selectedValues={selectedLayers}
          onChange={values => setSelectedLayers(values)}
          options={[...layers].reverse().map(layer => ({ value: layer.id, label: layer.name, disabled: !isLive && layer.id.includes("ais") }))}
        />
        <ToggleSelect
          selectedValues={selectedTileLayers}
          onChange={setSelectedTileLayers}
          options={[...tileLayerURLs].reverse().map((url, i) => ({ value: url, label: tileLayers[tileLayers.length-i-1] ? tileLayers[tileLayers.length-i-1].name : `Layer ${i}` }))}
          onRemove={url => setTileLayerURLs(urls => urls.filter(u => u !== url))}
          onMoveUp={handleMoveTileLayerUp}
        />
        <button onClick={handleAddTileURL}>Add</button>
        <label>Options</label>
        <label>
          <input type="checkbox" checked={showVesselNames} onChange={e => setShowVesselNames(e.target.checked)} />
          Show Vessel Names
        </label>
        <label>
          <input type="checkbox" checked={showVesselPredictedTrack} onChange={e => setShowVesselPredictedTrack(e.target.checked)} />
          Show Vessel Predicted Track
        </label>
        <label>
          <input type="checkbox" checked={showVesselAnimation} onChange={e => setShowVesselAnimation(e.target.checked)} />
          Show Vessel Animation
        </label>
        <AISKey />
      </div>
      <div style={{flex: 1}}>
        <StaticMap centre={centre} zoom={zoom} onClick={(lon, lat) => setCentre([lon, lat])} onDoubleClick={(lon, lat) => {setCentre([lon, lat]); setZoom(z=>z+1);}} draggable width="100%" height={768}>
          <WorldLayer />
          {
            tileLayerURLs.map((url, i) => selectedTileLayers.includes(url) && tileLayers[i] && <CanvasTileLayer key={i} layer={tileLayers[i]} />)
          }
          {selectedLayers.includes("grid") && <LatLonGridLayer />}
          {selectedLayers.includes("currents") && tideVectors && <VectorFieldLayer field={tideVectors} />}
          {selectedLayers.includes("currents-particles") &&  <CurrentParticleLayer time={currentTime} /> }
          {selectedLayers.includes("debug") && <DebugLayer />}
          {selectedLayers.includes("lights") && <LightLayer />}
          {selectedLayers.includes("ahais") && isLive && <AisHubVesselsLayer showNames={showVesselNames} animate={showVesselAnimation} projectTrack={showVesselPredictedTrack} />}
          {selectedLayers.includes("wsais") && isLive && <AISLayerSVG vessels={vesselsWS} fade showNames={showVesselNames} animate={showVesselAnimation} projectTrack={showVesselPredictedTrack} />}
          {selectedLayers.includes("wsais-canvas") && isLive && <AISLayerCanvas vessels={vesselsWS} />}
          {/* {selectedLayers.includes("ais") && <AISLayerSVG vessels={vessels} fade showNames animation />} */}
          {selectedLayers.includes("weather-gradient") &&  <WeatherGradientLayer time={currentTime} /> }
          {selectedLayers.includes("weather") &&  <WeatherLayer time={currentTime} /> }
          {selectedLayers.includes("weather-stations") && <WeatherStationsLayer time={currentTime} /> }
          {selectedLayers.includes("tides") && <TideHeightLayer time={currentTime} />}
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

/**
 * @param {string} time e.g. "12:00"
 */
function timeToMinutes (time) {
  const parts = time.split(":");
  return +parts[0] * 60 + +parts[1];
}

/**
 * @param {number} time e.g. 720
 * @returns {string} e.g. "12:00"
 */
function minutesToTime (time) {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}