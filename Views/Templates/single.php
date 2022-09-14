<h1><?=$entry->start->time->format("Y-m-d")?></h1>
<dl>
    <dt>From</dt>
    <dd><?=$entry->start->name?></dd>
    <dd><span class="hint"><?=view_time($entry->start->time)?></span></dd>
    <dt>To</dt>
    <dd><?=$entry->end->name?></dd>
    <dd><span class="hint"><?=view_time($entry->end->time)?></span></dd>
    <dt>Total Distance</dt>
    <dd><?=$entry->total_distance?> NM</dd>
    <dt>Total Duration</dt>
    <dd><?=$entry->total_duration->format("%a:%H:%I:%S")?> <?=getDurationSeconds($entry->total_duration)?></dd>
    <dt>Average Speed</dt>
    <dd><?=round($entry->total_distance / getDurationSeconds($entry->total_duration) * 3600, 2)?> knots</dd>
</dl>
<div id="map"></div>
<div id="polar-plot"></div>
<script src="/logbook/static/js/util.js"></script>
<script src="/logbook/static/vendor/passage-planner-lib.js"></script>
<script>
    fetch("/logbook/api/v1/logs/<?=dechex($entry->id)?>/track")
        .then(r => r.text())
        .then(t => {
            passagePlanner.renderGPXTrack(document.getElementById("map"), t);
        });
</script>