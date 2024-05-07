<p><?= count($entries) ?> passages</p>
<?php
$total_distance = 0;
$total_duration = 0;
foreach ($entries as $entry) {
    $total_distance += $entry->total_distance;
    $total_duration += getDurationSeconds($entry->total_duration);
}
echo "<p>{$total_distance} NM</p>";
$h = formatSecondsToHours($total_duration);
echo "<p>{$h}</p>";
?>