<?php

$title = "Logbook Extract - $dateSpec";
$entries = getAllEntries($db, ["dateSpec" => $dateSpec]);
$entry_years = getAllEntryYears($db);

$sub_year_groupings = [];
if (preg_match("/^\d{4}/", $dateSpec)) {
    $year = substr($dateSpec, 0, 4);

    $heading = $year;

    for ($i = 0; $i < 12; $i++) {
        $d = $year . "-" . str_pad($i + 1, 2, "0", STR_PAD_LEFT);
        $sub_year_groupings[$d] = getDateLabel($d);
    }

    for ($i = 25; $i <= 41; $i++) {
        $d = $year . "-" . str_pad($i, 2, "0", STR_PAD_LEFT);
        $sub_year_groupings[$d] = getDateLabel($d);
    }
}

$content = include_contents("Templates/index.php", [
    "entries" => $entries,
    "years" => $entry_years,
    "sub_year_groupings" => $sub_year_groupings,
    "heading" => getDateLabel($dateSpec),
]);

require("Templates/layout.php");
