<?php

/** @var LogbookEntry $entry */
/** @var float[] $bounds */
?>
<h1><?= $entry->start->time->format("Y-m-d") ?></h1>
<dl>
    <dt>From</dt>
    <dd><?= $entry->start->name ?></dd>
    <dd><span class="hint"><?= view_time($entry->start->time) ?></span></dd>
    <dt>To</dt>
    <dd><?= $entry->end->name ?></dd>
    <dd><span class="hint"><?= view_time($entry->end->time) ?></span></dd>
    <dt>Total Distance</dt>
    <dd><?= $entry->total_distance ?> NM</dd>
    <dt>Total Duration</dt>
    <dd><?= $entry->total_duration->format("%a:%H:%I:%S") ?></dd>
    <dt>Average Speed</dt>
    <dd><?= round($entry->total_distance / getDurationSeconds($entry->total_duration) * 3600, 2) ?> knots</dd>
    <dt>Trophies</dt>
    <dd><?php
        $trophies = getTrophies($entry->id);
        if ($trophies) view_trophies($trophies, $entry->id, getRecordSettingTracks());
        ?></dd>
    <dt>Bounding Box</dt>
    <dd><?php
        $bounds = $entry->getBounds();
        $minLat = round(abs($bounds['minLat']), 3) . "° " . ($bounds['minLat'] < 0 ? "S" : "N");
        $maxLat = round(abs($bounds['maxLat']), 3) . "° " . ($bounds['maxLat'] < 0 ? "S" : "N");
        $minLon = round(abs($bounds['minLon']), 3) . "° " . ($bounds['minLon'] < 0 ? "W" : "E");
        $maxLon = round(abs($bounds['maxLon']), 3) . "° " . ($bounds['maxLon'] < 0 ? "W" : "E");
        echo "$minLat – $maxLat<br/>$minLon – $maxLon";
        ?></dd>
    <dd><?= round(calcBoundsArea($bounds), 2) ?> NM²</dd>
    <dt>Export</dt>
    <dd><a href="/api/v1/logs/<?= dechex($entry->id) ?>/track">gpx</a></dd>
</dl>
<div id="map"></div>
<div id="polar-plot"></div>
<script src="/static/js/util.js"></script>
<script src="/static/vendor/passage-planner-lib.js"></script>
<script>
    fetch("/api/v1/logs/<?= dechex($entry->id) ?>/track")
        .then(r => r.text())
        .then(t => {
            passagePlanner.renderGPXTrack(document.getElementById("map"), t);
        });
</script>