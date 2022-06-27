import { useEffect, useState } from "react";

export function useFetchCSV (csvURL) {
    const [ csv, setCSV ] = useState(/** @type {{ headers: string[], rows: string[][] }} */({ headers: [], rows: [] }));

    useEffect(() => {
        if (!csvURL) return;

        fetch(csvURL).then(r => r.text()).then(text => {
            const lines = text.split("\n");
            const headers = lines.shift().split(",");
            const rows = lines.map(line => line.split(","));

            setCSV({ headers, rows });
        });
    }, [csvURL]);

    return csv;
}