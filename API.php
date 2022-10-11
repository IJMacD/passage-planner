<?php

class SQLException {
    const INTEGRITY_VIOLATION = "23000";
}

class API {

    function handleLogsGet () {
        $params = $_GET;

        $entries = getAllEntries($params);

        header("Content-Type: application/json");
        echo json_encode($entries);
    }

    function handleLogsPost () {
        $params = $_POST;

        $auth = Auth::verifyHeader();
        if (!$auth) {
            header("HTTP/1.1 403 Not Authorized");
            exit;
        }
        header("X-User: " . $auth['user']);

        $fields = ["total_distance", "start_location", "start_time", "end_location", "end_time", "weather", "comments"];
        $params = [];

        if (isset($_POST["id"])) {
            $params["id"] = $_POST["id"];
        } else {
            $params["id"] = random_int(100000, 1000000);
        }

        foreach ($fields as $field) {
            if (!isset($_POST[$field])) {
                header("HTTP/1.1 400 Bad Request");
                echo "$field not found in post data";
                exit;
            }

            $params[$field] = $_POST[$field];
        }

        global $db;

        $stmt = $db->prepare("INSERT INTO logbook (id, total_distance, start_location, start_time, end_location, end_time, weather, comments) VALUES (:id, :total_distance, :start_location, :start_time, :end_location, :end_time, :weather, :comments)");

        try {

            $stmt->execute($params);

            $params["start_timezone"] = "Asia/Hong_Kong";
            $params["end_timezone"] = "Asia/Hong_Kong";

            $entry = LogbookEntry::fromArray($params);

            header("Content-Type: application/json");
            echo json_encode($entry);
        }
        catch (PDOException $e) {
            if ($e->errorInfo[0] === SQLException::INTEGRITY_VIOLATION) {
                header("HTTP/1.1 409 Conflict");
            }
            else throw $e;
        }
    }

    function handleLogEntryGet ($id) {
        $entry = getEntry(hexdec($id));

        if (!$entry) {
            header("HTTP/1.1 404 Not Found");
            exit;
        }

        header("Content-Type: application/json");
        echo json_encode($entry);
    }

    function handleLogEntryPost ($id) {
        $params = $_POST;

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

        $params["id"] = hexdec($id);

        $stmt->execute($params);

        header("Content-Type: application/json");
        echo json_encode(["result" => "OK"]);
    }

    function handleLogEntryBounds ($id) {
        $bounds = getTrackBounds(hexdec($id));

        if ($bounds) {
            header("Content-Type: application/json");
            echo json_encode($bounds, JSON_NUMERIC_CHECK);
        }
        else {
            header("HTTP/1.1 404 Not Found");
            echo "Track not found";
        }
    }

    function handleLogEntryDelete ($id) {
        $auth = Auth::verifyHeader();
        if (!$auth) {
            header("HTTP/1.1 403 Not Authorized");
            exit;
        }
        header("X-User: " . $auth['user']);

        global $db;

        $stmt = $db->prepare("DELETE FROM logbook WHERE id = :id");
        $stmt->execute([ "id" => hexdec($id) ]);

        $stmt = $db->prepare("DELETE FROM logbook_tracks WHERE logbook_id = :id");
        $stmt->execute([ "id" => hexdec($id) ]);

        header("Content-Type: application/json");
        echo json_encode(["result" => "OK"]);
    }

    function handleLogTrackGet ($id) {
        global $db;

        $stmt = $db->prepare("SELECT gpx FROM logbook_tracks WHERE logbook_id = :id ORDER BY uploaded_date DESC LIMIT 1");

        $stmt->execute(["id" => hexdec($id)]);

        header("Content-Type: application/gpx+xml");
        echo $stmt->fetchColumn();
    }

    function handleLogTrackPost ($id) {
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

        $stmt->execute([ "id" => hexdec($id), "gpx" => $gpx ]);

        // Pre-calculate bounds
        calculateTrackBounds(hexdec($id));

        header("Content-Type: application/json");
        echo json_encode(["result" => "OK"]);
    }
}
