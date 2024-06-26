<?php

/**
 * @return LogbookEntry[]
 */
function getAllEntries($db, $params = [])
{
    $where = "";
    $sql_params = [];

    if (isset($params['year'])) {
        $where = "WHERE start_time >= ? AND start_time < ?";
        $sql_params[] = $params['year'] . "-01-01";
        $sql_params[] = ($params['year'] + 1) . "-01-01";
    } else if (isset($params['dateSpec'])) {
        $iso = iso8601($params['dateSpec']);
        if (!$iso) {
            return [];
        }

        $where = "WHERE start_time >= ? AND start_time < ?";
        $sql_params[] = $iso[0];
        $sql_params[] = $iso[1];
    }

    $sql = "SELECT
        id,
        name,
        total_distance,
        start_location,
        start_time,
        'Asia/Hong_Kong' AS start_timezone,
        end_location,
        end_time,
        'Asia/Hong_Kong' AS end_timezone,
        weather,
        comments
    FROM logbook
    $where
    ORDER BY start_time DESC";

    $stmt = $db->prepare($sql);

    $stmt->execute($sql_params);

    return $stmt->fetchAll(PDO::FETCH_CLASS, "LogbookEntry");
}

function getEntry($db, $id)
{

    $stmt = $db->prepare("SELECT id, name, total_distance, start_location, start_time, 'Asia/Hong_Kong' AS start_timezone, end_location, end_time, 'Asia/Hong_Kong' AS end_timezone, weather, comments FROM logbook WHERE `id` = :id");

    $stmt->execute(["id" => $id]);

    if ($stmt->rowCount() === 0) {
        return null;
    }

    $stmt->setFetchMode(PDO::FETCH_CLASS, "LogbookEntry");

    return $stmt->fetch();
}

/**
 * @return float[]|false
 */
function getTrackBounds($db, $id)
{

    $stmt = $db->prepare("SELECT bounds_W AS minLon, bounds_S AS minLat, bounds_E AS maxLon, bounds_N AS maxLat FROM logbook_tracks WHERE `logbook_id` = :id ORDER BY uploaded_date DESC LIMIT 1");

    $stmt->execute(["id" => $id]);

    $result = $stmt->fetch();

    if ($stmt->rowCount() === 0 || $result['minLon'] === null) {
        if (calculateTrackBounds($db, $id)) {
            $stmt->execute(["id" => $id]);
            return $stmt->fetch();
        } else {
            return false;
        }
    }

    return $result;
}

function getTrackPoints($db, $id): \DOMNodeList
{

    $stmt = $db->prepare("SELECT gpx FROM logbook_tracks WHERE logbook_id = :id AND gpx IS NOT NULL");

    $stmt->execute(["id" => $id]);

    if ($stmt->rowCount() === 0) {
        return new \DOMNodeList();
    }

    $gpx = $stmt->fetchColumn();

    $dom = new DOMDocument();
    $dom->loadXML($gpx);

    $points = $dom->getElementsByTagName("trkpt");

    return $points;
}

function calculateTrackBounds($db, $id)
{

    $points = getTrackPoints($db, $id);

    $minLon = INF;
    $minLat = INF;
    $maxLon = -INF;
    $maxLat = -INF;

    for ($i = 0; $i < $points->count(); $i++) {
        $point = $points->item($i);

        $lon = $point->attributes->getNamedItem("lon")->nodeValue;
        $lat = $point->attributes->getNamedItem("lat")->nodeValue;

        $minLon = min($minLon, $lon);
        $minLat = min($minLat, $lat);
        $maxLon = max($maxLon, $lon);
        $maxLat = max($maxLat, $lat);
    }

    $stmt = $db->prepare("UPDATE logbook_tracks SET bounds_W = :minLon, bounds_S = :minLat, bounds_E = :maxLon, bounds_N = :maxLat WHERE logbook_id = :id");

    return $stmt->execute([
        "id" => $id,
        "minLon" => $minLon,
        "minLat" => $minLat,
        "maxLon" => $maxLon,
        "maxLat" => $maxLat,
    ]);
}

function getOverallBounds($db)
{

    $stmt = $db->prepare(
        "SELECT
            MIN(bounds_W) AS minLon,
            MIN(bounds_S) AS minLat,
            MAX(bounds_E) AS maxLon,
            MAX(bounds_N) AS maxLat
        FROM
            logbook_entry_track
    "
    );

    $stmt->execute();

    return $stmt->fetch();
}

/**
 * Gets trophies acquired at time of start
 * i.e. still includes trophies that were subsequenctly lost
 */
function getTrophies($db, $id)
{

    $stmt = $db->prepare(
        "WITH Records AS (
            SELECT
                *,
                MIN(bounds_W) OVER (ORDER BY start_time) AS minLon,
                MIN(bounds_S) OVER (ORDER BY start_time) AS minLat,
                MAX(bounds_E) OVER (ORDER BY start_time) AS maxLon,
                MAX(bounds_N) OVER (ORDER BY start_time) AS maxLat,
                MAX(total_distance) OVER (ORDER BY start_time) AS maxDistance,
                MAX(TIMESTAMPDIFF(SECOND, start_time, end_time)) OVER (ORDER BY start_time) AS maxDuration,
                MAX(total_distance / TIMESTAMPDIFF(SECOND, start_time, end_time)) OVER (ORDER BY start_time) AS maxSpeed
            FROM
                logbook_entry_track
        )
        SELECT
            bounds_W = minLon AS Westernmost,
            bounds_S = minLat AS Southernmost,
            bounds_E = maxLon AS Easternmost,
            bounds_N = maxLat AS Northernmost,
            total_distance = maxDistance AS Farthest,
            TIMESTAMPDIFF(SECOND, start_time, end_time) = maxDuration AS Longest,
            (total_distance / TIMESTAMPDIFF(SECOND, start_time, end_time)) = maxSpeed AS Fastest
        FROM Records
        WHERE logbook_id = :id
    "
    );

    $stmt->execute(["id" => $id]);

    return $stmt->fetch();
}

function getRecordSettingTracks($db)
{

    $stmt = $db->prepare(
        "WITH Records AS (
            SELECT
                MIN(bounds_W) AS minLon,
                MIN(bounds_S) AS minLat,
                MAX(bounds_E) AS maxLon,
                MAX(bounds_N) AS maxLat,
                MAX(total_distance) AS maxDistance,
                MAX(TIMESTAMPDIFF(SECOND, start_time, end_time)) AS maxDuration,
                MAX(total_distance / TIMESTAMPDIFF(SECOND, start_time, end_time)) AS maxSpeed
            FROM logbook_entry_track
        )
        SELECT
            -- *,
            (SELECT logbook_id FROM logbook_entry_track WHERE bounds_W = minLon ORDER BY start_time, uploaded_date LIMIT 1) AS Westernmost,
            (SELECT logbook_id FROM logbook_entry_track WHERE bounds_S = minLat ORDER BY start_time, uploaded_date LIMIT 1) AS Southernmost,
            (SELECT logbook_id FROM logbook_entry_track WHERE bounds_E = maxLon ORDER BY start_time, uploaded_date LIMIT 1) AS Easternmost,
            (SELECT logbook_id FROM logbook_entry_track WHERE bounds_N = maxLat ORDER BY start_time, uploaded_date LIMIT 1) AS Northernmost,
            (
                SELECT logbook_id
                FROM logbook_entry_track AS t
                WHERE t.total_distance = maxDistance
                ORDER BY start_time, uploaded_date
                LIMIT 1
            ) AS Farthest,
            (
                SELECT logbook_id
                FROM logbook_entry_track AS t
                WHERE TIMESTAMPDIFF(SECOND, t.start_time, t.end_time) = maxDuration
                ORDER BY start_time, uploaded_date
                LIMIT 1
            ) AS Longest,
            (
                SELECT logbook_id
                FROM logbook_entry_track AS t
                WHERE
                    (total_distance / TIMESTAMPDIFF(SECOND, t.start_time, t.end_time)) = maxSpeed
                ORDER BY start_time, uploaded_date
                LIMIT 1
            ) AS Fastest
        FROM Records
    "
    );

    $stmt->execute();

    return $stmt->fetch();
}

function getAllEntryYears($db)
{
    $entry_years = [];
    foreach (getAllEntries($db) as $entry) {
        $y = $entry->start->time->format("Y");
        if (!in_array($y, $entry_years)) {
            $entry_years[] = $y;
        }
    }
    return $entry_years;
}

function getStartPoint($db, $id): array
{
    $points = getTrackPoints($db, $id);
    $point = $points->item(0);

    $lat = $point->attributes->getNamedItem("lat")->nodeValue;
    $lon = $point->attributes->getNamedItem("lon")->nodeValue;

    return ["lat" => $lat, "lon" => $lon];
}

function getEndPoint($db, $id): array
{
    $points = getTrackPoints($db, $id);
    $point = $points->item($points->count() - 1);

    $lat = $point->attributes->getNamedItem("lat")->nodeValue;
    $lon = $point->attributes->getNamedItem("lon")->nodeValue;

    return ["lat" => $lat, "lon" => $lon];
}
