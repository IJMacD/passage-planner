import React from "react";
import { getVesselColours } from "./VesselShapeByType.jsx";

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
        { value: 9, label: "Reserved (High Speed Craft)" },
        { value: 10, label: "Reserved (Wing Craft)" },
        { value: 11, label: "Reserved" },
        { value: 12, label: "Reserved" },
        { value: 13, label: "Reserved" },
        { value: 14, label: "Reserved" },
        { value: 15, label: "Undefined" },
    ];

    return (
        <table>
            <tbody>
            {
                navstat.map((stat, i) => {
                    const [ dark, light ] = getVesselColours({ navigationStatus: stat.value });
                    return (
                        <tr key={stat.value}>
                            <td>
                                <svg viewBox="-5 -10 10 15" width={16} height={16}>
                                    <path d="M 0 -10 L 5 5 L 0 2.5 L -5 5 Z"  fill={light} stroke={dark} strokeWidth={1} strokeLinejoin="round" />
                                </svg>
                            </td>
                            <td>
                                {stat.label}
                            </td>
                        </tr>
                    );
                })
            }
            </tbody>
        </table>
    );
}
