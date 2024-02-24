<h1><?= $title ?></h1>
<div id="map">Loading...</div>
<script src="/static/vendor/passage-planner-lib.js"></script>
<script>
    const tracksIDs =
        <?php
        $track_ids = [];
        foreach ($tracks as $track) {
            $track_ids[] = dechex($track->id);
        }
        echo json_encode($track_ids);
        ?>;

    Promise.all(
        tracksIDs.map(id => fetch(`/api/v1/logs/${id}.gpx`).then(r => r.text()))
    ).then(tracks => {
        passagePlanner.renderGPXTracks(document.getElementById("map"), tracks);
    });
</script>