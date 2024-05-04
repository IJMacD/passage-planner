<?php

$title = "Logbook Records";
$records = getRecordSettingTracks($db);
$content = include_contents("Templates/records.php", [
    "title" => $title,
    "records" => $records,
    "bounds" => getOverallBounds($db),
    "tracks" => getAllEntries($db),
]);

require("Templates/layout.php");
