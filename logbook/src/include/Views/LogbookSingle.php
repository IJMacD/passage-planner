<?php

/** @var LogbookEntry $entry */

$title = $entry->start->time->format("Y-m-d") . " Passage";
$description = "Passage from " . $entry->start->name . " to " . $entry->end->name;
$content = include_contents("Templates/single.php", [
    "entry" => $entry,
]);

require("Templates/layout.php");