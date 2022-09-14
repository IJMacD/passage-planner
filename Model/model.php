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

