<?php
global $baseURL;

$title = "Logbook Calendar";

if (!preg_match("/^\d{4}$/", $year)) {
    $year = date("Y");
}

$months = [];
for ($i = 0; $i < 12; $i++) {
    $months[] = getAllEntries($db, ["dateSpec" => $year . "-" . str_pad($i + 1, 2, "0", STR_PAD_LEFT)]);
}

$quarters = [];
for ($i = 0; $i < 4; $i++) {
    $quarters[] = getAllEntries($db, ["dateSpec" => $year . "-" . ($i + 33)]);
}

$content = include_contents("Templates/calendar.php", [
    "year" => $year,
    "heading" => $year,
    "months" => $months,
    "quarters" => $quarters,
    "prev_link" => "$baseURL/calendar/" . ($year - 1),
    "next_link" => $year == date("Y") ? null : "$baseURL/calendar/" . ($year + 1),
]);

require("Templates/layout.php");
