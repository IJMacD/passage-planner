<?php

class LogbookEntry implements JsonSerializable {
    var $id;
    var $total_distance;
    var $start_location;
    var $start_time;
    var $start_timezone;
    var $end_location;
    var $end_time;
    var $end_timezone;
    var $weather;
    var $comments;

    function __get($name)
    {
        if ($name === "total_duration") {
            $end = new DateTime($this->end_time);
            $start = new DateTime($this->start_time);

            return $end->diff($start);
        }

        if ($name === "start") {
            $time = new DateTime($this->start_time);
            $time->setTimezone(new DateTimeZone($this->start_timezone));

            return (object)[
                "name" => $this->start_location,
                "time" => $time,
            ];
        }

        if ($name === "end") {
            $time = new DateTime($this->end_time);
            $time->setTimezone(new DateTimeZone($this->end_timezone));

            return (object)[
                "name" => $this->end_location,
                "time" => $time,
            ];
        }
    }

    function jsonSerialize()
    {
        $start = $this->start;
        $end = $this->end;

        $start->time = $start->time->format(DateTime::RFC3339);
        $end->time = $end->time->format(DateTime::RFC3339);

        return [
            "id" => dechex($this->id),
            "totalDistance" => $this->total_distance,
            "totalDuration" => formatDuration($this->total_duration),
            "start" => $start,
            "end" => $end,
            "weather" => $this->weather,
            "comments" => $this->comments,
        ];
    }

    static function fromArray ($array) {
        $result = new self();
        foreach ($array as $key => $value) {
            $result->$key = $value;
        }
        return $result;
    }
}

/**
 * @param DateInterval $duration
 */
function formatDuration ($duration) {
    $str = "P";
    if ($duration->days > 0) {
        $str .= $duration->days . "D";
    }
    $str .= "T";
    if ($duration->h > 0) {
        $str .= $duration->h . "H";
    }
    if ($duration->i > 0) {
        $str .= $duration->i . "M";
    }
    if ($duration->s > 0) {
        $str .= $duration->s . "S";
    }
    return $str;
}