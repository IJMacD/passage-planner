import { Point } from "./gpx";

export function interpolatePosition(allPoints: Point[], currentTime: number): { lon: number; lat: number; } | null {
    const currentIndex = allPoints.findIndex(p => p.time && p.time.getTime() >= currentTime);
    const prevPoint = allPoints[currentIndex - 1];
    const nextPoint = allPoints[currentIndex];

    if (!prevPoint || !nextPoint || !prevPoint.time || !nextPoint.time) {
        return null;
    }

    const timeDiff = nextPoint.time.getTime() - prevPoint.time.getTime();
    const factor = (currentTime - prevPoint.time.getTime()) / timeDiff;

    const lon = prevPoint.lon + factor * (nextPoint.lon - prevPoint.lon);
    const lat = prevPoint.lat + factor * (nextPoint.lat - prevPoint.lat);

    return { lon, lat };
}
