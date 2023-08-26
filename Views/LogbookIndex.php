<?php

$title = "Logbook";
$entries = getAllEntries();
$content = include_contents("Templates/index.php", ["entries" => $entries ]);

require("Templates/layout.php");