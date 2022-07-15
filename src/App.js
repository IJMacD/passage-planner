import React, { useState } from "react";
import Live from "./Pages/Live";
import './App.css';
import Passage from "./Pages/Passage";
import Tracks from "./Pages/Tracks";
import Test from "./Pages/Test";


export default function App () {
    const [ tab, setTab ] = useState("live");

    return (
        <div className="App">
            <nav style={{display:"block"}}>
                <button onClick={() => setTab("live")} disabled={tab==="live"}>Live</button>
                <button onClick={() => setTab("passage")} disabled={tab==="passage"}>Passage</button>
                <button onClick={() => setTab("track")} disabled={tab==="track"}>Tracks</button>
                <button onClick={() => setTab("test")} disabled={tab==="test"}>Test</button>
            </nav>
            { tab === "live" && <Live /> }
            { tab === "passage" && <Passage /> }
            { tab === "track" && <Tracks /> }
            { tab === "test" && <Test /> }
        </div>
    );
}