<?php

/**
 * @param DateTime $datetime
 */
function to_seconds($datetime)
{
    $start_of_day = clone $datetime;
    $start_of_day->setTime(0, 0, 0, 0);
    $diff = $datetime->diff($start_of_day, true);

    return ($diff->h * 60 + $diff->i) * 60 + $diff->s;
}

function get_sunrise_sunset($lon, $lat)
{
}

/** @param DateInterval $duration */
function getDurationSeconds($duration)
{
    return (($duration->days * 24 + $duration->h) * 60 + $duration->i) * 60 + $duration->s;
}

// Ref : https://www.movable-type.co.uk/scripts/latlong.html

function lat2nm($lat1, $lat2)
{
    return abs($lat1 - $lat2) * 60;
}

function lon2nm($point1, $point2)
{
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
function latlon2nm($point1, $point2)
{
    $ns = lat2nm($point1['lat'], $point2['lat']);
    $ew = lon2nm($point1, $point2);
    return sqrt($ns * $ns + $ew * $ew);
}

/**
 * @param array $bounds ['minLat' => float,'minLon' => float,'maxLat' => float,'maxLon' => float]
 * @return float Distance in square nautical miles
 */
function calcBoundsArea($bounds)
{
    $latDist = lat2nm($bounds['minLon'], $bounds['maxLon']);
    $min = ['lon' => $bounds['minLon'], 'lat' => $bounds['minLat']];
    $max = ['lon' => $bounds['maxLon'], 'lat' => $bounds['maxLat']];
    $lonDist = lon2nm($min, $max);

    return $latDist * $lonDist;
}

function isAJAXRequest()
{
    return !isset($_SERVER['HTTP_ACCEPT']) || strstr($_SERVER['HTTP_ACCEPT'], "text/html") === false;
}

/**
 * Returns array of [inclusive start, exclusive end]
 * i.e. [start, end)
 */
function iso8601($dateSpec)
{
    if (strstr($dateSpec, "--") !== false) {
        $parts = explode("--", $dateSpec);
        $start = iso8601($parts[0]);
        $end = iso8601($parts[1]);

        // exclusive range spec
        return [$start[0], $end[0]];

        // inclusive range spec
        // return [$start[0], $end[1]];
    }

    if (preg_match("/^\d{4}$/", $dateSpec)) {
        return [
            $dateSpec . "-01-01",
            ($dateSpec + 1) . "-01-01",
        ];
    }

    if (preg_match("/^(\d{4})-(\d{2})$/", $dateSpec, $matches)) {
        $y1 = $matches[1];
        $m1 = $matches[2];

        $y2 = $y1;
        $m2 = $m1 + 1;

        if ($m2 > 12) {
            $y2++;
            $m2 = 1;
        }

        return [
            $y1 . "-" . str_pad($m1, 2, "0", STR_PAD_LEFT) . "-01",
            $y2 . "-" . str_pad($m2, 2, "0", STR_PAD_LEFT) . "-01",
        ];
    }

    if (preg_match("/^(\d{4})-(\d{2})-(\d{2})$/", $dateSpec, $matches)) {
        $y1 = $matches[1];
        $m1 = $matches[2];
        $d1 = $matches[3];

        $y2 = $y1;
        $m2 = $m1;
        $d2 = $d1 + 1;

        if ($d2 > month_length($y2, $m2)) {
            $m2++;
            $d2 = 1;
        }

        if ($m2 > 12) {
            $y2++;
            $m2 = 1;
        }

        return [
            $y1 . "-" . str_pad($m1, 2, "0", STR_PAD_LEFT) . "-" . str_pad($d1, 2, "0", STR_PAD_LEFT),
            $y2 . "-" . str_pad($m2, 2, "0", STR_PAD_LEFT) . "-" . str_pad($d2, 2, "0", STR_PAD_LEFT),
        ];
    }

    if (preg_match("/^(\d{4})-(\d{3})$/", $dateSpec, $matches)) {
        $y1 = $matches[1];
        $od = $matches[2];

        $cumlMonthLengths = is_leap_year($y1) ?
            [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366] :
            [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        $m1 = 0;
        $d1 = 0;
        for ($i = 0; $i < 12; $i++) {
            if ($od <= $cumlMonthLengths[$i]) {
                $m1 = $i;
                $d1 = $od - $cumlMonthLengths[$i - 1];
                break;
            }
        }

        $y2 = $y1;
        $m2 = $m1;
        $d2 = $d1 + 1;

        if ($d2 > month_length($y2, $m2)) {
            $m2++;
            $d2 = 1;
        }

        if ($m2 > 12) {
            $y2++;
            $m2 = 1;
        }

        return [
            $y1 . "-" . str_pad($m1, 2, "0", STR_PAD_LEFT) . "-" . str_pad($d1, 2, "0", STR_PAD_LEFT),
            $y2 . "-" . str_pad($m2, 2, "0", STR_PAD_LEFT) . "-" . str_pad($d2, 2, "0", STR_PAD_LEFT),
        ];
    }
}

function month_length(int $year, int $month)
{
    if ($month === 2) {
        return is_leap_year($year) ? 29 : 28;
    }

    return [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][$month - 1];
}

function is_leap_year(int $year)
{
    if ($year % 400 === 0) {
        return true;
    }

    if ($year % 100 === 0) {
        return false;
    }

    if ($year % 4 === 0) {
        return true;
    }

    return false;
}
