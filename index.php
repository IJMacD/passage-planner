<?php
ini_set("display_errors", 1);

require_once "AccessControl.php";
require_once "Auth.php";
require_once "Router.php";
require_once "Model/LogbookEntry.php";
require_once "Model/model.php";
require_once "Views/view.php";
require_once "util.php";
require_once "db.php";

AccessControl::allowOrigin("http://localhost:3000");
AccessControl::allowMethod("post");
AccessControl::allowMethod("delete");
AccessControl::allowHeader("Authorization");
AccessControl::setMaxAge(60 * 60);

Auth::maintenance();

Router::setRoot("/logbook");

Router::registerWithPrefix("/api/v1", [
    ["get",     "/logs/:hid/track",     fn($hid) => handleAPILogTrackGet(hexdec($hid))],
    ["post",    "/logs/:hid/track",     fn($hid) => handleAPILogTrackPost(hexdec($hid))],
    ["get",     "/logs/:hid/bounds",    fn($hid) => handleAPILogEntryBounds(hexdec($hid))],
    ["get",     "/logs/:hid",           fn($hid) => handleAPILogEntryGet(hexdec($hid))],
    ["post",    "/logs/:hid",           fn($hid) => handleAPILogEntryPost(hexdec($hid), $_POST)],
    ["delete",  "/logs/:hid",           fn($hid) => handleAPILogEntryDelete(hexdec($hid))],
    ["get",     "/logs",                fn() => handleAPILogsGet($_GET)],
    ["post",    "/logs",                fn() => handleAPILogsPost($_POST)],
]);
Router::registerWithPrefix("/api/v1/auth", [
    ["post",    "/generate",    [ "Auth", "handleGenerate" ]],
    ["post",    "/exchange",    [ "Auth", "handleExchange" ]],
    ["post",    "/verify",      [ "Auth", "handleVerify" ]],
]);
Router::register([
    ["get",     "/records",     fn() => handleRecords()],
    ["get",     "/:hid",        fn($hid) => handleLogEntry(hexdec($hid))],
    ["get",     "/",            fn() => handleIndex()],
    ["get",     "",             fn() => handleIndex()],
    ["options", "*",            fn() => null],
]);

try {
    if (!Router::execute()){
        header("HTTP/1.1 404 Not Found");
        echo "Not Found";
    }
} catch (PDOException $e) {
    header("HTTP/1.1 500 Server Error");
    print_r($e->getMessage());
} catch (Exception $e) {
    header("HTTP/1.1 500 Server Error");
    echo $e->getMessage();
}

function handleIndex () {
    $entries = getAllEntries();
    include "Views/LogbookIndex.php";
}


function handleRecords () {
    $records = getRecordSettingTracks();
    include "Views/LogbookRecords.php";
}

function handleLogEntry ($id) {
    $entry = getEntry($id);

    if (!$entry) {
        header("HTTP/1.1 404 Not Found");
        exit;
    }

    include "Views/LogbookSingle.php";
}

function handleAPILogsGet ($params) {
    $entries = getAllEntries($params);

    header("Content-Type: application/json");
    echo json_encode($entries);
}

function handleAPILogsPost ($params) {
    $auth = Auth::verifyHeader();
    if (!$auth) {
        header("HTTP/1.1 403 Not Authorized");
        exit;
    }
    header("X-User: " . $auth['user']);

    $fields = ["total_distance", "start_location", "start_time", "end_location", "end_time", "weather", "comments"];
    $params = ["id" => random_int(100000, 1000000)];

    foreach ($fields as $field) {
        if (!isset($_POST[$field])) {
            header("HTTP/1.1 400 Bad Request");
            exit;
        }

        $params[$field] = $_POST[$field];
    }

    global $db;

    $stmt = $db->prepare("INSERT INTO logbook (id, total_distance, start_location, start_time, end_location, end_time, weather, comments) VALUES (:id, :total_distance, :start_location, :start_time, :end_location, :end_time, :weather, :comments)");

    $stmt->execute($params);

    $params["start_timezone"] = "Asia/Hong_Kong";
    $params["end_timezone"] = "Asia/Hong_Kong";

    $entry = LogbookEntry::fromArray($params);

    header("Content-Type: application/json");
    echo json_encode($entry);
}

function handleAPILogEntryGet ($id) {
    $entry = getEntry($id);

    if (!$entry) {
        header("HTTP/1.1 404 Not Found");
        exit;
    }

    header("Content-Type: application/json");
    echo json_encode($entry);
}

function handleAPILogEntryPost ($id, $params) {
    $auth = Auth::verifyHeader();
    if (!$auth) {
        header("HTTP/1.1 403 Not Authorized");
        exit;
    }
    header("X-User: " . $auth['user']);

    $fields = ["total_distance", "start_location", "start_time", "end_location", "end_time", "weather", "comments"];
    $set_list = [];
    foreach ($params as $key => $value) {
        if (in_array($key, $fields, true)) {
            $set_list[] = "`$key` = :$key";
        }
        else {
            unset($params[$key]);
        }
    }

    $set = implode(", ", $set_list);

    global $db;

    $stmt = $db->prepare("UPDATE logbook SET $set WHERE `id` = :id");

    $params["id"] = $id;

    $stmt->execute($params);

    header("Content-Type: application/json");
    echo json_encode(["result" => "OK"]);
}

function handleAPILogEntryBounds ($id) {
    $bounds = getTrackBounds($id);

    if ($bounds) {
        header("Content-Type: application/json");
        echo json_encode($bounds, JSON_NUMERIC_CHECK);
    }
    else {
        header("HTTP/1.1 404 Not Found");
        echo "Track not found";
    }
}

function handleAPILogEntryDelete ($id) {
    $auth = Auth::verifyHeader();
    if (!$auth) {
        header("HTTP/1.1 403 Not Authorized");
        exit;
    }
    header("X-User: " . $auth['user']);

    global $db;

    $stmt = $db->prepare("DELETE FROM logbook WHERE id = :id");
    $stmt->execute([ "id" => $id ]);

    $stmt = $db->prepare("DELETE FROM logbook_tracks WHERE logbook_id = :id");
    $stmt->execute([ "id" => $id ]);

    header("Content-Type: application/json");
    echo json_encode(["result" => "OK"]);
}

function handleAPILogTrackGet ($id) {
    global $db;

    $stmt = $db->prepare("SELECT gpx FROM logbook_tracks WHERE logbook_id = :id");

    $stmt->execute(["id" => $id]);

    header("Content-Type: application/gpx+xml");
    echo $stmt->fetchColumn();
}

function handleAPILogTrackPost ($id) {
    $auth = Auth::verifyHeader();
    if (!$auth) {
        header("HTTP/1.1 403 Not Authorized");
        exit;
    }
    header("X-User: " . $auth['user']);

    if (!isset($_FILES['gpx'])) {
        header("HTTP/1.1 400 Bad Request");
        exit;
    }

    $gpx = file_get_contents($_FILES['gpx']['tmp_name']);

    global $db;

    $stmt = $db->prepare("INSERT INTO logbook_tracks (logbook_id, gpx) VALUES (:id, :gpx)");

    $stmt->execute([ "id" => $id, "gpx" => $gpx ]);

    // Pre-calcualte bounds
    calculateTrackBounds($id);

    header("Content-Type: application/json");
    echo json_encode(["result" => "OK"]);
}
