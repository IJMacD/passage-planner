<h1>Logbook Records</h1>
<?php

foreach ($records as $record => $id):
    $entry = getEntry($id);
?>
    <div style="display:inline-block; margin: 1em; padding: 0.5em 1em; border: 1px solid #333;text-align:center;">
        <span style="font-size: 5em;">🏆</span>
        <p><?=$record?></p>
        <p><a href="/logbook/<?=dechex($entry->id)?>"><?=$entry->start->time->format("Y-m-d")?></a></p>
    </div>

<?php
endforeach;
?>
<div id="map"></div>
<script src="/logbook/static/vendor/passage-planner-lib.js"></script>
<script>
    const bounds = <?=json_encode(getOverallBounds(), JSON_NUMERIC_CHECK)?>;
    const track = {
        name: "Bounds",
        segments: [
            [
                { lon: bounds.minLon, lat: bounds.minLat },
                { lon: bounds.maxLon, lat: bounds.minLat },
                { lon: bounds.maxLon, lat: bounds.maxLat },
                { lon: bounds.minLon, lat: bounds.maxLat },
                { lon: bounds.minLon, lat: bounds.minLat },
            ]
        ]
    };
    passagePlanner.renderTrackMap(document.getElementById("map"), track);
</script>