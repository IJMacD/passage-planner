<?php

function include_contents ($filename, $vars = []) {
    if (!is_file(__DIR__ . "/" . $filename)) {
        return false;
    }

    extract($vars);

    ob_start();
    include __DIR__ . "/" . $filename;
    return ob_get_clean();
}

function view_time ($dateTime) {
    return '<time datetime="'.$dateTime->format(DateTime::RFC3339).'">'.$dateTime->format(DateTime::RFC3339).'</time>';
}

function view_trophies ($trophies, $entry_id = null, $records = []) {
    foreach ($trophies as $name => $collected) {
        if ($collected) {
            $currentHolder = $records[$name] === $entry_id;
            $boldStyle = $currentHolder ? "font-weight: bold;" : "";
            $title = $currentHolder ? "Current $name" : "$name at time";
            echo '<span style="display: inline-block;'.$boldStyle.'" title="'.$title.'">🏆 '.$name.'</span>';
        }
    }
}