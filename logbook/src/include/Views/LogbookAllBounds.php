<?php

$title = "Logbook Bounds";
$tracks = getAllEntries($db);
$content = include_contents("Templates/all_bounds.php", [
    "title" => $title,
    "tracks" => $tracks
]);

require("Templates/layout.php");
