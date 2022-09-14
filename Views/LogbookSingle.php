<?php

$title = "Logbook Entry " . dechex($entry->id);
$content = include_contents("Templates/single.php", ["entry" => $entry]);

require("Templates/layout.php");