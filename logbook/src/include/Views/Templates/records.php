<h1><?= $title ?></h1>
<?php

foreach ($records as $record => $id) :
    $entry = getEntry($db, $id);

    if ($entry == null) continue;
?>
    <div style="display:inline-block; margin: 1em; padding: 0.5em 1em; border: 1px solid #333;text-align:center;">
        <span style="font-size: 5em;">🏆</span>
        <p><?= $record ?></p>
        <p><a href="<?= $baseURL ?>/<?= dechex($entry->id) ?>"><?= $entry->start->time->format("Y-m-d") ?></a></p>
    </div>

<?php
endforeach;
?>
<div id="map"></div>
<script src="<?= $baseURL ?>/static/vendor/passage-planner-lib.js"></script>
<script>
    const bounds = [
        <?php
        foreach ($tracks as $track) {
            echo json_encode(getTrackBounds($db, $track->id), JSON_NUMERIC_CHECK) . ",\n";
        }
        ?>
    ];
    const tracks = bounds.map(b => ({
        name: "Bounds",
        segments: [{
                lon: b.minLon,
                lat: b.minLat
            },
            {
                lon: b.maxLon,
                lat: b.minLat
            },
            {
                lon: b.maxLon,
                lat: b.maxLat
            },
            {
                lon: b.minLon,
                lat: b.maxLat
            },
            {
                lon: b.minLon,
                lat: b.minLat
            },
        ],
        color: "orange"
    }));

    const overallBounds = <?= json_encode($bounds, JSON_NUMERIC_CHECK) ?>;
    const overallTrack = {
        name: "Bounds",
        segments: [
            [{
                    lon: overallBounds.minLon,
                    lat: overallBounds.minLat
                },
                {
                    lon: overallBounds.maxLon,
                    lat: overallBounds.minLat
                },
                {
                    lon: overallBounds.maxLon,
                    lat: overallBounds.maxLat
                },
                {
                    lon: overallBounds.minLon,
                    lat: overallBounds.maxLat
                },
                {
                    lon: overallBounds.minLon,
                    lat: overallBounds.minLat
                },
            ]
        ]
    };
    tracks.push(overallTrack);
    passagePlanner.renderTrackMap(document.getElementById("map"), tracks);
</script>