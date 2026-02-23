<?php

$title = "Logbook Bounds";
$params = [];
if (isset($_GET['date'])) {
    $params['dateSpec'] = $_GET['date'];
}
$tracks = getAllEntries($db, $params);
$content = include_contents("Templates/all_bounds.php", [
    "title" => $title,
    "tracks" => $tracks
]);

require("Templates/layout.php");
