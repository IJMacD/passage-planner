<?php
$count = count($entries);
$total_distance = 0;
$init_dt = new DateTime();
$curr_dt = clone $init_dt;
foreach($entries as $entry) {
    $total_distance += $entry->total_distance;
    $curr_dt->add($entry->total_duration);
}
$total_duration = $curr_dt->diff($init_dt);
$total_duration_seconds = $init_dt->getTimestamp() - $curr_dt->getTimestamp();
$total_avg_speed = $total_distance / $total_duration_seconds * 3600;
$records = getRecordSettingTracks();
?>
<p><?=$count?> logbook entries.</p>
<table>
    <thead>
        <tr>
            <th>Passage</th>
            <th>From</th>
            <th>To</th>
            <th>Distance</th>
            <th>Duration</th>
            <th>Average Speed</th>
            <th><a href="/logbook/records">Trophies</a></th>
        </tr>
    </thead>
    <tbody>
        <?php foreach($entries as $entry): ?>
            <tr>
                <td rowspan="2">
                    <a href="/logbook/<?=dechex($entry->id)?>"><?=$count--?></a>
                </td>
                <td>
                    <?=$entry->start->name?><br/>
                    <span class="hint"><?=view_time($entry->start->time)?></span>
                </td>
                <td>
                    <?=$entry->end->name?><br/>
                    <span class="hint"><?=view_time($entry->end->time)?></span>
                </td>
                <td rowspan="2"><?=$entry->total_distance?> NM</td>
                <td rowspan="2"><?=$entry->total_duration->format("%a:%H:%I:%S")?></td>
                <td rowspan="2"><?=round($entry->total_distance / getDurationSeconds($entry->total_duration) * 3600, 2)?> knots</td>
                <td rowspan="2"><?php
                    $trophies = getTrophies($entry->id);
                    if ($trophies) view_trophies($trophies, $entry->id, $records);
                ?></td>
            </tr>
            <tr>
                <td colspan="2">
                    <?=include_contents("Templates/day_chart.php", ["entry" => $entry])?>
                </td>
            </tr>
        <?php endforeach; ?>
    </tbody>
    <tfoot>
        <tr>
            <th></th>
            <th></th>
            <th></th>
            <th><?=$total_distance?> NM</th>
            <th><?=$total_duration->format("%a:%H:%I:%S")?></th>
            <th><?=round($total_avg_speed, 2)?> knots</th>
            <th></th>
        </tr>
    </tfoot>
</table>
<script src="/logbook/static/js/util.js"></script>