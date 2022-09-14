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