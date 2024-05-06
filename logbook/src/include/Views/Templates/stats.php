<?php

/**
 * @var LogbookEntry[] $entries
 */
$count = count($entries);
$total_distance = 0;
$init_dt = new DateTime();
$curr_dt = clone $init_dt;
foreach ($entries as $entry) {
    $total_distance += $entry->total_distance;
    $curr_dt->add($entry->total_duration);
}
$total_duration = $curr_dt->diff($init_dt);
$total_duration_seconds = $init_dt->getTimestamp() - $curr_dt->getTimestamp();
$total_avg_speed = $total_duration_seconds > 0 ?
    $total_distance / $total_duration_seconds * 3600 :
    0;
$records = getRecordSettingTracks($db);
?>
<?php if (isset($heading)) : ?>
    <h1><?= $heading ?></h1>
<?php endif; ?>
<p><?= $count ?> logbook <?= $count === 1 ? "entry" : "entries" ?>.</p>
<table>
    <thead>
        <tr>
            <th>Passage</th>
            <th>From</th>
            <th>To</th>
            <th>Distance</th>
            <th>Displacement</th>
            <th>Efficiency</th>
            <th>Bounding Box</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($entries as $entry) :
            $displacement = latlon2nm(getStartPoint($db, $entry->id), getEndPoint($db, $entry->id));
        ?>
            <tr>
                <td>
                    <a href="<?= $baseURL ?>/<?= dechex($entry->id) ?>"><?= $count-- ?></a>
                </td>
                <td>
                    <?= $entry->start->name ?><br />
                    <span class="hint"><?= view_time($entry->start->time) ?></span>
                </td>
                <td>
                    <?= $entry->end->name ?><br />
                    <span class="hint"><?= view_time($entry->end->time) ?></span>
                </td>
                <td><?= $entry->total_distance ?> NM</td>
                <td><?= round($displacement, 3) ?> NM</td>
                <td><?= round($displacement / $entry->total_distance * 100) ?>%</td>
                <td><?= round(calcBoundsArea(getTrackBounds($db, $entry->id)), 2) ?> NM²</td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
<script src="<?= $baseURL ?>/static/js/util.js"></script>