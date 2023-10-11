import React, { createContext, useContext, useState } from 'react';
import { latlon2nm as latLon2nm } from '../util/geo.js';
import { useAnimation } from '../hooks/useAnimation.js';
import { getVesselColours, getVesselShape } from './VesselShapeByType.jsx';
import { isMoving } from '../util/isMoving.js';

const baseStation = { lon: 114.173162, lat: 22.303057 };

const SortableContext = createContext({ sortField: "", setSortField: /** @type {any} */(null) })

/**
 *
 * @param {object} props
 * @param {import('../hooks/useWebsocketVessels.js').VesselReport[]} props.vessels
 * @param {(lon: number, lat: number) => void} [props.onClickLonLat]
 * @param {"decimal"|"minutes"} [props.latLonMode]
 * @returns
 */
export function VesselTable({ vessels, onClickLonLat, latLonMode = "decimal" }) {
  const [ sortField, setSortField ] = useState("-lastUpdate");

  useAnimation(true, 1000);

  const sorted = vessels.slice().sort(sortVessels(sortField));

  const now = Date.now();

  return (
    <table style={{width:"100%"}}>
      <SortableContext.Provider value={{ sortField, setSortField }}>
        <thead>
          <tr>
            <td></td>
            <SortableHeading field="mmsi">MMSI</SortableHeading>
            <SortableHeading field="name">Name</SortableHeading>
            <th>Latitude</th>
            <th>Longitude</th>
            <SortableHeading field="speedOverGround">Speed</SortableHeading>
            <th>Course</th>
            <th>Heading</th>
            <th>Call Sign</th>
            <th>Type</th>
            <th>LOA</th>
            <th>Beam</th>
            <th>Draught</th>
            <th>Destination</th>
            <th>ETA</th>
            <SortableHeading field="lastUpdate">Last Update</SortableHeading>
            <SortableHeading field="range">Range</SortableHeading>
          </tr>
        </thead>
      </SortableContext.Provider>
      <tbody>
        {sorted.map(vessel => {
          const p = { lon: vessel.longitude, lat: vessel.latitude };
          const dist = latLon2nm(p, baseStation);

          const loa = typeof vessel.dimensionToBow === "number" &&
            typeof vessel.dimensionToStern === "number" ?
              vessel.dimensionToBow + vessel.dimensionToStern :
              undefined;

          const beam = typeof vessel.dimensionToPort === "number" &&
            typeof vessel.dimensionToStarboard === "number" ?
              vessel.dimensionToPort + vessel.dimensionToStarboard :
              undefined;

          let opacity = 1;

          const delta = now - vessel.lastUpdate;

          if (delta > 600_000) {
            opacity = 0;
          }
          else if (delta > 300_000) {
            opacity = 0.5;
          }

          const [ stroke, fill ] = getVesselColours(vessel);
          const strokeDash = isMoving(vessel) ? void 0 : "1 1";
          const strokeWidth = isMoving(vessel) ? 2 : 1;
          const courseOverGround = typeof vessel.courseOverGround === "number" ? vessel.courseOverGround : 0;
          const rotation = typeof vessel.trueHeading === "number" ? vessel.trueHeading : courseOverGround;

          return (
            <tr key={vessel.mmsi}>
              <td>
                <svg viewBox="-10 -10 20 20" style={{ width: 20, height: 20 }}>
                  <path d={getVesselShape(vessel, 5)} transform={`rotate(${rotation})`} stroke={stroke} fill={fill} opacity={opacity} strokeWidth={strokeWidth} strokeDasharray={strokeDash} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </td>
              <td><a href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${vessel.mmsi}`} target="_blank" rel="noreferrer">{vessel.mmsi}</a></td>
              <td>{vessel.name}</td>
              <td>
                { onClickLonLat ?
                  <button className="link" onClick={() => onClickLonLat(vessel.longitude, vessel.latitude)}>
                    {formatLatitude(vessel.latitude, latLonMode)}
                  </button> :
                  formatLatitude(vessel.latitude, latLonMode)
                }
              </td>
              <td>
                { onClickLonLat ?
                  <button className="link" onClick={() => onClickLonLat(vessel.longitude, vessel.latitude)}>
                    {formatLongitude(vessel.longitude, latLonMode)}
                  </button> :
                  formatLongitude(vessel.longitude, latLonMode)
                }
              </td>
              <td>{vessel.speedOverGround} {typeof vessel.speedOverGround === "number" && "kn"}</td>
              <td>{vessel.courseOverGround}{typeof vessel.courseOverGround === "number" && "°"}</td>
              <td>{vessel.trueHeading}{typeof vessel.trueHeading === "number" && "°"}</td>
              <td>{vessel.callSign}</td>
              <td>{vessel.shipType}</td>
              <td>{loa}</td>
              <td>{beam}</td>
              <td>{vessel.draught}</td>
              <td>{vessel.destination}</td>
              <td>{vessel.etaMonth ? `${vessel.etaMonth.toString().padStart(2, "0")}-${vessel.etaDay.toString().padStart(2, "0")}T${vessel.etaHour.toString().padStart(2, "0")}:${vessel.etaMinute.toString().padStart(2, "0")}Z` : ""}</td>
              <td>{typeof vessel.lastUpdate=="number"?Math.floor((Date.now() - vessel.lastUpdate) / 1000)+"s":""}</td>
              <td>{dist.toFixed(2)} NM</td>
            </tr>
          );
        })
        }
      </tbody>
    </table>
  );
}

/**
 * @param {string} field
 */
function sortVessels (field) {
  const descending = field[0] === "-";

  if (descending) {
    field = field.substring(1);
  }

  return (a, b) => {
    let _a = a[field];
    let _b = b[field];

    if (field === "range") {
      _a = latLon2nm({ lon: a.longitude, lat: a.latitude }, baseStation);
      _b = latLon2nm({ lon: b.longitude, lat: b.latitude }, baseStation);
    }

    if (typeof _a === "undefined")
      return 1;
    if (typeof _b === "undefined")
      return -1;

    const k = descending ? -1 : 1;

    if (typeof _a == "string") {
      return k * _a.localeCompare(_b);
    }

    return (_a - _b) * k;
  };
}

function SortableHeading ({ field, children }) {
  const { sortField, setSortField } = useContext(SortableContext);

  const sortDescending = sortField[0] === "-";
  const rawField = sortDescending ? sortField.substring(1) : sortField
  const isActive = field === rawField;

  /** @type {import('react').CSSProperties} */
  const style = {
    textDecoration: isActive ? "underline" : "none",
    cursor: "pointer",
  };

  function handleClick () {
    if (isActive) {
      setSortField(sortDescending ? field : `-${field}`);
    }
    else {
      setSortField(field);
    }
  }

  return <th style={style} onClick={handleClick}>{children}</th>
}

/**
 * @param {number} longitude
 * @param {"decimal"|"minutes"} latLonMode
 */
function formatLongitude (longitude, latLonMode) {
  if (latLonMode === "decimal") return longitude.toFixed(5);

  const sign = Math.sign(longitude) > 0 ? "E" : "W";
  const degrees = Math.floor(Math.abs(longitude));
  const minutes = ((longitude % 1) * 60).toFixed(2).padStart(2, "0");

  return `${degrees}° ${minutes}′ ${sign}`;
}

/**
 * @param {number} latitude
 * @param {"decimal"|"minutes"} latLonMode
 */
function formatLatitude (latitude, latLonMode) {
  if (latLonMode === "decimal") return latitude.toFixed(5);

  const sign = Math.sign(latitude) > 0 ? "N" : "S";
  const degrees = Math.floor(Math.abs(latitude));
  const minutes = ((latitude % 1) * 60).toFixed(2).padStart(2, "0");

  return `${degrees}° ${minutes}′ ${sign}`;
}