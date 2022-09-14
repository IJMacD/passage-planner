<?php

$title = "Logbook Records";
$content = include_contents("Templates/records.php", [ "records" => $records ]);

require("Templates/layout.php");