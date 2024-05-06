<?php

$title = "Logbook Stats";
$entries = getAllEntries($db);
$content = include_contents("Templates/stats.php", [
    "db" => $db,
    "entries" => $entries,
]);

require("Templates/layout.php");
