<?php

$title = "Logbook";
$entries = getAllEntries($db);
$entry_years = getAllEntryYears($db);
$content = include_contents("Templates/index.php", ["db" => $db, "entries" => $entries, "years" => $entry_years]);

require("Templates/layout.php");
