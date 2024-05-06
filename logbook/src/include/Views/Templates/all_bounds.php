<h1><?= $title ?></h1>
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
    passagePlanner.renderTrackMap(document.getElementById("map"), tracks);
</script>