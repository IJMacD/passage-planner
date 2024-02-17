<?php

$title = "Logbook Extract - $dateSpec";
$entries = getAllEntries(["dateSpec" => $dateSpec]);
$content = include_contents("Templates/index.php", ["entries" => $entries]);

require("Templates/layout.php");
