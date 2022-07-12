import { useState } from "react";
import Live from "./Pages/Live";
import './App.css';
import Passage from "./Pages/Passage";
import Tracks from "./Pages/Tracks";


export default function App () {
    const [ tab, setTab ] = useState("live");

    return (
        <div className="App">
            <nav style={{display:"block"}}>
                <button onClick={() => setTab("live")} disabled={tab==="live"}>Live</button>
                <button onClick={() => setTab("passage")} disabled={tab==="passage"}>Passage</button>
                <button onClick={() => setTab("track")} disabled={tab==="track"}>Tracks</button>
            </nav>
            { tab === "live" && <Live /> }
            { tab === "passage" && <Passage /> }
            { tab === "track" && <Tracks /> }
        </div>
    );
}