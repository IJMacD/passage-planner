<?php

/**
 * @property-read DateInterval $total_duration
 * @property-read (object{time:DateTime, name:string}) $start
 * @property-read (object{time:DateTime, name:string}) $end
 */
class LogbookEntry implements JsonSerializable
{
    var $id;
    var $name;
    /** @var float $total_distance Nautical Miles */
    var $total_distance;
    private $start_location;
    private $start_time;
    private $start_timezone;
    private $end_location;
    private $end_time;
    private $end_timezone;
    /** @var string $weather Description */
    var $weather;
    /** @var string $comments Description */
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

    function jsonSerialize(): mixed
    {
        $start = $this->start;
        $end = $this->end;

        $start->time = $start->time->format(DateTime::RFC3339);
        $end->time = $end->time->format(DateTime::RFC3339);

        return [
            "id" => dechex($this->id),
            "name" => $this->name,
            "totalDistance" => $this->total_distance,
            "totalDuration" => formatDuration($this->total_duration),
            "start" => $start,
            "end" => $end,
            "weather" => $this->weather,
            "comments" => $this->comments,
        ];
    }

    static function fromArray($array)
    {
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
function formatDuration($duration)
{
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
