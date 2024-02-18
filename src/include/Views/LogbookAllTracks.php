<?php

$title = "Logbook Tracks";
$tracks = getAllEntries();
$content = include_contents("Templates/all_tracks.php", [
    "title" => $title,
    "tracks" => $tracks
]);

require("Templates/layout.php");