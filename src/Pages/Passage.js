import { useState } from "react";
import { HeadingIndicator } from "../Components/HeadingIndicator.js";
import { latlon2bearing, latlon2nm } from "../util/geo.js";
import { useSavedState } from "../hooks/useSavedState.js";
import { useWeather } from "../hooks/useWeather.js";
import { MarkerLayer } from "../Layers/MarkerLayer.js";
import { PathLayer } from "../Layers/PathLayer.js";
import { findForecast, getPointOfSail } from "../util/weather.js";
import { PointOfSail } from "../Components/PointOfSail.js";
import { ParticleLayer } from "../Layers/ParticleLayer.js";
import { BasicMap } from "../Components/BasicMap.js";
import { HongKongMarineLayer } from "../Layers/HongKongMarineLayer.js";
import React from "react";

const KPH_TO_KNOTS = 0.539957;

/**
 * @typedef {{name: string;date: Date;averageSpeed: number;start: Point;end: Point;waypoints: Point[];}} Passage
 */

/**
 * @typedef Point
 * @prop {number} lon
 * @prop {number} lat
 * @prop {string?} [name]
 * @prop {Date?} [time]
*/

/** @type {Passage} */
const defaultPassage = {
    name: "New Passage",
    date: new Date(),
    averageSpeed: 0,
    start: {
        lon: 0,
        lat: 0,
        name: "",
        time: null,
    },
    end: {
        lon: 0,
        lat: 0,
        name: "",
        time: null,
    },
    waypoints: [],
}

function Passage () {
    const [ centre, setCentre ] = useSavedState("passagePlanner.centre", /** @type {[number,number]} */([0,0]));
    const [ zoom, setZoom ] = useSavedState("passagePlanner.zoom", 4);
    const [ savedPassages, setSavedPassages ] = useSavedState("passagePlanner.passages", /** @type {Passage[]} */([]));
    const [ editMode, setEditMode ] = useState("start");
    const [ selectedWaypoint, setSelectedWayPoint ] = useState(-1);

    const [ passage, setPassage ] = useState(defaultPassage);

    const weather = useWeather(centre);

    const haveStart = passage.start.lat !== 0 || passage.start.lon !== 0;
    const haveEnd = passage.end.lat !== 0 || passage.end.lon !== 0;
    const haveStartAndEnd = haveStart && haveEnd;

    /**
     * @param {Date} date
     */
    function setPassageDate (date) {
        setPassage(passage => {
            let time = passage.start.time;
            if (time) {
                time.setFullYear(date.getFullYear());
                time.setMonth(date.getMonth());
                time.setDate(date.getDate());
            }
            return { ...passage, date, start: { ...passage.start, time } };
        });
    }

    function removeWaypoint (index) {
        setPassage(passage => ({ ...passage, waypoints: passage.waypoints.filter((_, i) => i !== index) }));
    }

    function editWaypoint (index) {
        setSelectedWayPoint(index === selectedWaypoint ? -1 : index);
        setEditMode("edit-waypoint");
    }

    function setStartTime (time) {
        const timeRegex = /(\d{2}):(\d{2})(?::(\d{2}))?/;
        const match = timeRegex.exec(time);
        if (match) {
            setPassage(passage => {
                const newDate = new Date(+passage.date);

                newDate.setHours(+match[1]);
                newDate.setMinutes(+match[2]);
                if (match[3]) {
                    newDate.setSeconds(+match[3]);
                }

                return { ...passage, start: { ...passage.start, time: newDate } };
            });
        }
    }

    // Unserialize
    function loadPassage (passage) {
        if (typeof passage.date === "string") {
            passage.date = new Date(passage.date);
        }
        if (typeof passage.start.time === "string") {
            passage.start.time = new Date(passage.start.time);
        }
        if (typeof passage.end.time === "string") {
            passage.end.time = new Date(passage.end.time);
        }
        for (const wp of passage.waypoints) {
            if (typeof wp.eta === "string") {
                wp.eta = new Date(wp.eta);
            }
        }
        setPassage(passage);
    }

    function handleMapClick (lon, lat) {
        if (editMode === "start") {
            setPassage(passage => ({ ...passage, start: { ...passage.start, lon, lat } }));
            if (!haveEnd) {
                setEditMode("end");
            }
        }
        else if (editMode === "end") {
            setPassage(passage => ({ ...passage, end: { ...passage.end, lon, lat } }));
        }
        else if (editMode === "add-waypoint") {
            setPassage(passage => ({ ...passage, waypoints: [ ...passage.waypoints, {lon, lat} ]}));
        }
        else if (editMode === "edit-waypoint") {
            setPassage(passage => ({ ...passage, waypoints: passage.waypoints.map((wp, i) => i === selectedWaypoint ? {lon, lat} : wp) }));
        }
    }

    function handleSave () {
        setSavedPassages(passages => [ passage, ...passages.filter(p => p.name !== passage.name) ]);
    }

    const startMarker = { ...passage.start, name: "green-pin" };
    const endMarker = { ...passage.end, name: "finish-pin" };

    const wayPointMarkers = passage.waypoints.map((wp, i) => ({ ...wp, name: i === selectedWaypoint ? "blue-dot" : "red-dot" }));

    const routePoints = haveStartAndEnd ? [ startMarker, ...wayPointMarkers, endMarker ] :
        (haveStart ? [startMarker] : (haveEnd ? [endMarker] : []));

    function EditModeButton ({ name, label = "Set"}) {
        return <button onClick={() => setEditMode(name)} disabled={editMode === name}>{ label }</button>
    }

    const legs = makeLegs(passage);

    const totalDistance = legs.reduce((total, leg) => total + latlon2nm(leg.from, leg.to), 0);

    const totalTime = passage.averageSpeed > 0 ? totalDistance / passage.averageSpeed : 0;

    const legWeathers = legs.map(leg => (weather && leg.eta && findForecast(weather, leg.eta)) || null);

    const legPaths = legs.map((leg, i) => {
        const forecast = legWeathers[i];
        const noGo = forecast && getPointOfSail(leg.bearing, forecast.ForecastWindDirection).id === "no-go";
        return ({ points: [ leg.from, leg.to ], color: noGo ? "grey" : "red", lineDash: noGo ? [4,4] : null });
    });

    let firstForecast = legWeathers.find(x => x) || null;

    /** @type {[number,number]?} */
    const weatherVector = firstForecast &&
        [
            firstForecast.ForecastWindSpeed * -Math.sin(firstForecast.ForecastWindDirection/180*Math.PI),
            firstForecast.ForecastWindSpeed * Math.cos(firstForecast.ForecastWindDirection/180*Math.PI)
        ];

    const posMarkers = legs.map((leg, i) => {
        const forecast = legWeathers[i];
        if (!forecast) return null;

        const pointOfSail = getPointOfSail(leg.bearing, forecast.ForecastWindDirection);

        return {
            lat: (leg.from.lat + leg.to.lat) / 2,
            lon: (leg.from.lon + leg.to.lon) / 2,
            name: pointOfSail.id,
            rotation: leg.bearing,
        };
    })

    return (
        <div style={{padding: "1em"}}>
            <h1>Plan Passage</h1>

            <div style={{display:"flex"}}>
                <div>
                    <ul>
                        {
                            savedPassages.map(p => <li key={p.name}>{p.name} <button onClick={() => loadPassage(p)}>Load</button></li>)
                        }
                    </ul>
                    <button onClick={() => setPassage(defaultPassage)}>Clear</button><br/>
                    <input value={passage.name} onChange={e => setPassage(p => ({ ...p, name: e.target.value }))} />
                    { passage.name && <button onClick={handleSave}>Save</button> }
                    <label style={{display:"block"}}>
                        Date
                        <input type="date" value={passage.date.toISOString().substring(0,10)} onChange={e => setPassageDate(e.target.valueAsDate||new Date())} />
                    </label>
                    <h2>Route</h2>

                    <h3>Start</h3>
                    <Location location={passage.start} />
                    <EditModeButton name="start" />
                    <label style={{display:"block"}}>
                        Time
                        <input type="time" value={passage.start.time?.toLocaleTimeString()||""} onChange={e => setStartTime(e.target.value)} />
                    </label>
                    <label style={{display:"block"}}>
                        Average Speed
                        <input type="number" value={passage.averageSpeed} onChange={e => setPassage(passage => ({ ...passage, averageSpeed: +e.target.value }))} size={4} />
                        knots
                    </label>

                    <h3>Destination</h3>
                    <Location location={passage.end} />
                    <EditModeButton name="end" />
                    <p>Distance: {totalDistance.toFixed(2)} NM</p>
                    { passage.averageSpeed > 0 && <p>Time: <Time hours={totalTime} /></p> }
                    { passage.averageSpeed > 0 && passage.start.time &&
                        <p>ETA: {legs[legs.length - 1].eta?.toLocaleTimeString()}</p>
                    }
                    { haveStartAndEnd && false &&
                        <>
                            <h3>Displacement</h3>
                            <p>Total Displacement: {latlon2nm(passage.start, passage.end).toFixed(2)} NM</p>
                            <p>Initial Bearing to Destination: {latlon2bearing(passage.start, passage.end).toFixed(0)}°</p>
                        </>
                    }

                    <h3>Waypoints</h3>
                    <ul>
                        {
                            passage.waypoints.map((wp,i) => (
                                <li key={i}>
                                    <Location location={wp} style={{fontWeight:i === selectedWaypoint ? "bold":"normal"}} />
                                    <button onClick={() => removeWaypoint(i)}>Remove</button>
                                    <button onClick={() => editWaypoint(i)}>Edit</button>
                                </li>
                            ))
                        }
                    </ul>
                    <EditModeButton name="add-waypoint" label="Add" />
                </div>
                <BasicMap centre={centre} zoom={zoom} setCentre={setCentre} setZoom={setZoom} onClick={handleMapClick}>
                    <HongKongMarineLayer />
                    <PathLayer paths={legPaths} />
                    { weatherVector && <ParticleLayer vector={weatherVector} /> }
                    <MarkerLayer markers={posMarkers} />
                    <MarkerLayer markers={routePoints} onClick={i => (i-1) !== selectedWaypoint && editWaypoint(i-1)} />
                </BasicMap>
            </div>

            <h1>Details</h1>

            <h2>Legs</h2>
            <table style={{width:"100%"}}>
                <thead>
                    <tr>
                        <th>Leg</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Distance</th>
                        <th>Bearing</th>
                        <th>Duration</th>
                        <th>ETA</th>
                        <th>Weather</th>
                        <th>Point of Sail</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Leg 0</td>
                        <td>Start</td>
                        <td><Location location={passage.start} /></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>{passage.start.time?.toLocaleTimeString()}</td>
                        <td></td>
                    </tr>
                    {
                        legs.map((leg,i) => {
                            const forecast = weather && leg.eta && findForecast(weather, leg.eta);

                            return (
                                <tr key={i}>
                                    <td>Leg {i+1}</td>
                                    <td><Location location={leg.from} /></td>
                                    <td><Location location={leg.to} /></td>
                                    <td>{leg.distance.toFixed(2)} NM</td>
                                    <td>
                                        {leg.bearing.toFixed(0).padStart(3, "0")}°
                                        <HeadingIndicator heading={leg.bearing} />
                                    </td>
                                    <td>{ leg.duration > 0 && <Time hours={leg.duration} /> }</td>
                                    <td>{ leg.eta?.toLocaleTimeString() }</td>
                                    <td>{ forecast &&
                                        <>
                                            <HeadingIndicator heading={(forecast.ForecastWindDirection + 180) % 360} fill="blue" stroke="darkblue" />
                                            {(forecast.ForecastWindSpeed * KPH_TO_KNOTS).toFixed()} knots
                                        </>
                                    }</td>
                                    <td>{ forecast && <PointOfSail heading={leg.bearing} windDirection={forecast.ForecastWindDirection} /> }</td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
    )
}

export default Passage;

/**
 *
 * @param {object} props
 * @param {{lat: number, lon: number}} props.location
 * @param {import("react").CSSProperties} [props.style]
 * @returns
 */
function Location ({ location, style = {} }) {
    if (location.lat === 0 && location.lon === 0) return null;

    return <span style={style}>{location.lat.toFixed(3)},{location.lon.toFixed(3)}</span>
}

function Time ({ hours }) {
    if (!isFinite(hours)) return null;
    return <span>{Math.floor(hours)}:{((hours%1)*60).toFixed(0).padStart(2, "0")}</span>;
}

/**
 *
 * @param {Passage} passage
 * @returns {{ from: Point, to: Point, eta?: Date, distance: number, duration: number, bearing: number}[]}
 */
function makeLegs (passage) {
    const legs = [{ from: passage.start, to: passage.waypoints[0]??passage.end }, ...passage.waypoints.map((wp, i) => ({ from: wp, to: passage.waypoints[i+1]??passage.end })) ];

    // let cumlDist = 0;
    let cumlTime = 0;

    for (const leg of legs) {
        leg.distance = latlon2nm(leg.from, leg.to);
        leg.duration = passage.averageSpeed > 0 ? leg.distance / passage.averageSpeed : 0;
        leg.bearing = latlon2bearing(leg.from, leg.to);

        // cumlDist += leg.distance;
        cumlTime += leg.duration;

        leg.eta = (passage.averageSpeed > 0 && passage.start.time) ? new Date(+passage.start.time + cumlTime * 60 * 60 * 1000) : null;
    }

    // @ts-ignore
    return legs;
}

