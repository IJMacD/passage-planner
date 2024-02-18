<?php

$title = "Logbook Records";
$records = getRecordSettingTracks();
$content = include_contents("Templates/records.php", [
    "title" => $title,
    "records" => $records,
    "bounds" => getOverallBounds(),
    "tracks" => getAllEntries(),
]);

require("Templates/layout.php");