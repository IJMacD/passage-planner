<?php

$jd_start = isotojd($chart_range[0]);
$jd_end   = isotojd($chart_range[1]);
?>

<style>
    .entry-chart {
        display: flex;
        align-items: flex-end;
    }

    .entry-chart div {
        background: #DDD;
        width: 4px;
        flex: 1;
    }
</style>

<div class="entry-chart">
    <?php for ($jd = $jd_start; $jd < $jd_end; $jd++) {
        $date = jdtoiso($jd);
        $day_entries = array_filter($entries, function ($entry) use ($date) {
            return $date === substr($entry->start->time->format("c"), 0, 10);
        });

        $value = array_reduce($day_entries, function ($total, $entry) {
            return $total + getDurationSeconds($entry->duration);
        }, 0);

        echo '<div style="height:' . ($value * 0.002) . 'px"></div>';
    }
    ?>
</div>