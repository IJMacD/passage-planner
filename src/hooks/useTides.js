import { useMemo } from "react";
import { useFetchCSV } from "./useFetchCSV";

const today = formatDate();
const start_dt = `${today}%2000:00:00`;
const end_dt = `${today}%2023:45:00`;
const mode = "Surface";
const tideCSVURL = `https://passage.ijmacd.com/tides/en/download_csv.php?start_dt=${start_dt}&end_dt=${end_dt}&mode=${mode}`;

export function useTides (time) {
    const tideCSV = useFetchCSV(tideCSVURL);

    const tideVectors = useMemo(() => {
        // const timeCol = tideCSV.headers.indexOf("Time");
        const timeCol = 1;
        const latCol = 4;
        const lonCol = 5;
        const magCol = 2;
        const dirCol = 3;
        const tideRowsAtTime = tideCSV.rows.filter(r => r[timeCol] === time);

        return tideRowsAtTime.map(row => ({ latitude: +row[latCol], longitude: +row[lonCol], magnitude: +row[magCol], direction: +row[dirCol] }));
    }, [time, tideCSV]);

    return tideVectors;
}

function formatDate (date = new Date()) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}