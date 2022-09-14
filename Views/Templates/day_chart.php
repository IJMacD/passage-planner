<?php
$scale = 0.01;
$left = to_seconds($entry->start->time) * $scale;
$width = to_seconds($entry->end->time) * $scale - $left;
?>

<div class="day-chart" style="width: <?=(86400*$scale)?>px">
    <span class="day-chart-start-label" style="width:<?=$left?>px"><?=$entry->start->time->format("H:i:s")?></span>
    <div class="day-chart-indicator" style="width: <?=$width?>px;"></div>
    <span class="day-chart-end-label"><?=$entry->end->time->format("H:i:s")?></span>
</div>