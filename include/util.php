<?php

/**
 * @param DateTime $datetime
 */
function to_seconds ($datetime) {
    $start_of_day = clone $datetime;
    $start_of_day->setTime(0, 0, 0, 0);
    $diff = $datetime->diff($start_of_day, true);

    return ($diff->h * 60 + $diff->i) * 60 + $diff->s;
}

function get_sunrise_sunset ($lon, $lat) {

}

/** @param DateInterval $duration */
function getDurationSeconds ($duration) {
    return (($duration->days * 24 + $duration->h) * 60 + $duration->i) * 60 + $duration->s;
}

// Ref : https://www.movable-type.co.uk/scripts/latlong.html

function lat2nm ($lat1, $lat2) {
    return abs($lat1 - $lat2) * 60;
}

function lon2nm ($point1, $point2) {
    $avgLat = ($point1['lat'] + $point2['lat']) / 2;
    $latRad = $avgLat / 180 * M_PI;
    $distAtEquator = 60.1088246;
    return abs($point1['lon'] - $point2['lon']) * cos($latRad) * $distAtEquator;
}

// Equirectangualr approximation
/**
 * @param {{ lon: number; lat: any; }} point1
 * @param {{ lon: number; lat: any; }} point2
 */
function latlon2nm ($point1, $point2) {
    $ns = lat2nm($point1['lat'], $point2['lat']);
    $ew = lon2nm($point1, $point2);
    return sqrt($ns * $ns + $ew * $ew);
}

/**
 * @param array $bounds ['minLat' => float,'minLon' => float,'maxLat' => float,'maxLon' => float]
 * @return float Distance in square nautical miles
 */
function calcBoundsArea ($bounds) {
    $latDist = lat2nm($bounds['minLon'], $bounds['maxLon']);
    $min = ['lon' => $bounds['minLon'], 'lat' => $bounds['minLat']];
    $max = ['lon' => $bounds['maxLon'], 'lat' => $bounds['maxLat']];
    $lonDist = lon2nm($min, $max);

    return $latDist * $lonDist;
}

function isAJAXRequest () {
    return !isset($_SERVER['HTTP_ACCEPT']) || strstr($_SERVER['HTTP_ACCEPT'], "text/html") === false;
}