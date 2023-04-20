import React from "react";
import { getVesselColours } from "./VesselShapeByNavigation.js";

export function AISKey () {

    const navstat = [
        { value: 0, label: "Underway" },
        { value: 1, label: "At Anchor" },
        { value: 2, label: "Not Under Command" },
        { value: 3, label: "Restricted Manoeuvrability" },
        { value: 4, label: "Constrained by Draught" },
        { value: 5, label: "Moored" },
        { value: 6, label: "Aground" },
        { value: 7, label: "Fishing" },
        { value: 8, label: "Sailing" },
        { value: 9, label: "Reserved" },
        { value: 10, label: "Reserved" },
        { value: 11, label: "Reserved" },
        { value: 12, label: "Reserved" },
        { value: 13, label: "Reserved" },
        { value: 14, label: "Reserved" },
        { value: 15, label: "Undefined" },
    ];

    return (
        <svg viewBox={`0 0 200 400`} style={{ }}>
        {
            navstat.map((stat, i) => {
                const [ dark, light ] = getVesselColours({ navigationStatus: stat.value });
                return (
                    <g key={stat.value} transform={`translate(10, ${i * 20 + 10})`}>
                        <path d="M 0 -10 L 5 5 L 0 2.5 L -5 5 Z"  fill={light} stroke={dark} strokeWidth={1} strokeLinejoin="round" />
                        <text x={10} y={5}>{stat.label}</text>
                    </g>
                );
            })
        }
        </svg>
    );
}
