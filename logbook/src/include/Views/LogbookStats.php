<?php

$title = "Logbook Stats";
$entries = getAllEntries();
$content = include_contents("Templates/stats.php", ["entries" => $entries]);

require("Templates/layout.php");
