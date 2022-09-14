<?php

function getAllEntries ($params = []) {
    global $db;

    $stmt = $db->prepare("SELECT id, total_distance, start_location, start_time, 'Asia/Hong_Kong' AS start_timezone, end_location, end_time, 'Asia/Hong_Kong' AS end_timezone, weather, comments FROM logbook ORDER BY start_time DESC");

    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_CLASS, "LogbookEntry");
}

function getEntry ($id) {
    global $db;

    $stmt = $db->prepare("SELECT id, total_distance, start_location, start_time, 'Asia/Hong_Kong' AS start_timezone, end_location, end_time, 'Asia/Hong_Kong' AS end_timezone, weather, comments FROM logbook WHERE `id` = :id");

    $stmt->execute(["id" => $id]);

    if ($stmt->rowCount() === 0) {
        return null;
    }

    $stmt->setFetchMode(PDO::FETCH_CLASS, "LogbookEntry");

    return $stmt->fetch();
}

function getTrackBounds ($id) {
    global $db;

    $stmt = $db->prepare("SELECT bounds_W AS minLon, bounds_S AS minLat, bounds_E AS maxLon, bounds_N AS maxLat FROM logbook_tracks WHERE `logbook_id` = :id AND bounds_W IS NOT NULL");

    $stmt->execute([ "id" => $id ]);

    if ($stmt->rowCount() === 0) {
        if (calculateTrackBounds($id)) {
            $stmt->execute([ "id" => $id ]);
        }
        else {
            return false;
        }
    }

    return $stmt->fetch();
}

function calculateTrackBounds ($id) {
    global $db;

    $stmt = $db->prepare("SELECT gpx FROM logbook_tracks WHERE logbook_id = :id AND gpx IS NOT NULL");

    $stmt->execute([ "id" => $id ]);

    if ($stmt->rowCount() === 0) {
        return false;
    }

    $gpx = $stmt->fetchColumn();

    $dom = new DOMDocument();
    $dom->loadXML($gpx);

    $points = $dom->getElementsByTagName("trkpt");

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

function getOverallBounds () {
    global $db;

    $stmt = $db->prepare(
        "SELECT
            MIN(bounds_W) AS minLon,
            MIN(bounds_S) AS minLat,
            MAX(bounds_E) AS maxLon,
            MAX(bounds_N) AS maxLat
        FROM
            logbook_tracks
    ");

    $stmt->execute();

    return $stmt->fetch();
}

function getTrophies ($id) {
    global $db;

    $stmt = $db->prepare(
        "WITH Records AS (
            SELECT
                *,
                MIN(bounds_W) OVER (ORDER BY l.start_time) AS minLon,
                MIN(bounds_S) OVER (ORDER BY l.start_time) AS minLat,
                MAX(bounds_E) OVER (ORDER BY l.start_time) AS maxLon,
                MAX(bounds_N) OVER (ORDER BY l.start_time) AS maxLat,
                MAX(l.total_distance) OVER (ORDER BY l.start_time) AS maxDistance,
                MAX(TIMESTAMPDIFF(SECOND, start_time, end_time)) OVER (ORDER BY l.start_time) AS maxDuration,
                MAX(l.total_distance / TIMESTAMPDIFF(SECOND, start_time, end_time)) OVER (ORDER BY l.start_time) AS maxSpeed
            FROM
                logbook_tracks AS t
                INNER JOIN
                logbook AS l
                ON t.logbook_id = l.id
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
    ");

    $stmt->execute([ "id" => $id ]);

    return $stmt->fetch();
}

function getRecordSettingTracks () {
    global $db;

    $stmt = $db->prepare(
        "WITH Records AS (
            SELECT
                MIN(bounds_W) AS minLon,
                MIN(bounds_S) AS minLat,
                MAX(bounds_E) AS maxLon,
                MAX(bounds_N) AS maxLat,
                MAX(l.total_distance) AS maxDistance,
                MAX(TIMESTAMPDIFF(SECOND, start_time, end_time)) AS maxDuration,
                MAX(l.total_distance / TIMESTAMPDIFF(SECOND, start_time, end_time)) AS maxSpeed
            FROM
                logbook_tracks AS t
                INNER JOIN
                logbook AS l
                ON l.id = t.logbook_id
        )
        SELECT
            -- *,
            (SELECT logbook_id FROM logbook_tracks WHERE bounds_W = minLon) AS Westernmost,
            (SELECT logbook_id FROM logbook_tracks WHERE bounds_S = minLat) AS Southernmost,
            (SELECT logbook_id FROM logbook_tracks WHERE bounds_E = maxLon) AS Easternmost,
            (SELECT logbook_id FROM logbook_tracks WHERE bounds_N = maxLat) AS Northernmost,
            (
                SELECT logbook_id
                FROM
                    logbook_tracks AS t
                    INNER JOIN
                    logbook AS l
                    ON l.id = t.logbook_id
                WHERE l.total_distance = maxDistance
            ) AS Farthest,
            (
                SELECT logbook_id
                FROM
                    logbook_tracks AS t
                    INNER JOIN
                    logbook AS l
                    ON l.id = t.logbook_id
                WHERE TIMESTAMPDIFF(SECOND, l.start_time, l.end_time) = maxDuration
            ) AS Longest,
            (
                SELECT logbook_id
                FROM
                    logbook_tracks AS t
                    INNER JOIN
                    logbook AS l
                    ON l.id = t.logbook_id
                WHERE (l.total_distance / TIMESTAMPDIFF(SECOND, l.start_time, l.end_time)) = maxSpeed
            ) AS Fastest
        FROM Records
    ");

    $stmt->execute();

    return $stmt->fetch();
}