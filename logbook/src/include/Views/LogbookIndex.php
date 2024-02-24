<?php

$title = "Logbook";
$entries = getAllEntries();
$entry_years = getAllEntryYears();
$content = include_contents("Templates/index.php", ["entries" => $entries, "years" => $entry_years]);

require("Templates/layout.php");
