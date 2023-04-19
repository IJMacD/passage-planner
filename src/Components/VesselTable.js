import React from 'react';
import { latlon2nm } from '../util/geo.js';

const baseStation = { lon: 114.173162, lat: 22.303057 };

/**
 *
 * @param {object} props
 * @param {import('../hooks/useWSAIS').VesselReport[]} props.vessels
 * @returns
 */
export function VesselTable({ vessels }) {
  const sorted = vessels.slice().sort(sortVessels);

  return (
    <table style={{width:"100%"}}>
      <thead>
        <tr>
          <th>MMSI</th>
          <th>Name</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Speed</th>
          <th>Course</th>
          <th>Heading</th>
          <th>Call Sign</th>
          <th>Type</th>
          <th>LOA</th>
          <th>Beam</th>
          <th>Draught</th>
          <th>Destination</th>
          <th>ETA</th>
          <th>Last Update</th>
          <th>Range</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(vessel => {
          const p = { lon: vessel.longitude, lat: vessel.latitude };
          const dist = latlon2nm(p, baseStation);

          return (
            <tr key={vessel.mmsi}>
              <td><a href={`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${vessel.mmsi}`} target="_blank" rel="noreferrer">{vessel.mmsi}</a></td>
              <td>{vessel.name}</td>
              <td>{vessel.latitude.toFixed(5)}</td>
              <td>{vessel.longitude.toFixed(5)}</td>
              <td>{vessel.speedOverGround} kn</td>
              <td>{vessel.courseOverGround}</td>
              <td>{vessel.trueHeading}</td>
              <td>{vessel.callSign}</td>
              <td>{vessel.shipType}</td>
              <td>{(vessel.dimensionToBow + vessel.dimensionToStern) || ""}</td>
              <td>{(vessel.dimensionToPort + vessel.dimensionToStarboard) || ""}</td>
              <td>{vessel.draught}</td>
              <td>{vessel.destination}</td>
              <td>{vessel.etaMonth ? `\u2011\u2011${vessel.etaMonth.toString().padStart(2, "0")}\u2011${vessel.etaDay.toString().padStart(2, "0")}T${vessel.etaHour.toString().padStart(2, "0")}:${vessel.etaMinute.toString().padStart("2", 0)}` : ""}</td>
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

function sortVessels(a, b) {
  if (typeof a.lastUpdate === "undefined")
    return 1;
  if (typeof b.lastUpdate === "undefined")
    return -1;
  return b.lastUpdate - a.lastUpdate;
}
