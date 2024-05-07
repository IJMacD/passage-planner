<?php if (isset($heading)) : ?>
    <h1><?= $heading ?></h1>
    <p>
        <?php if ($prev_link) : ?><a href="<?= $prev_link ?>">prev</a><? endif; ?>
        <?php if ($next_link) : ?><a href="<?= $next_link ?>">next</a><? endif; ?>
    </p>
<?php endif; ?>

<?php
$month_names = [
    "January",  "February", "March",
    "April",    "May",      "June",
    "July",     "August",   "September",
    "October",  "November", "December",
];

?>
<style>
    .calendar {
        display: grid;
        grid-template-columns: 3fr 3fr 3fr 2fr;
        background-color: #F8F8F8;
        gap: 1em;
        padding: 1em;
    }

    .calendar>div {
        background-color: white;
        padding: 0.5em;
    }

    .calendar>div h2 {
        margin-top: 0;
    }
</style>

<div class="calendar">

    <?php for ($i = 0; $i < 12; $i++) : ?>
        <div>
            <h2><?= $month_names[$i] ?></h2>
            <?php
            $entries = $months[$i];
            if (count($entries)) {
                include("entry_stats.php");

                $chart_range = iso8601("$year-" . str_pad($i + 1, 2, "0", STR_PAD_LEFT));
                include("entry_chart.php");
            }
            ?>
        </div>

        <?php if ($i % 3 === 2) : ?>
            <?php
            $q = floor($i / 3);
            ?>
            <div>
                <h2>Q<?= ($q + 1) ?></h2>
                <?php
                $entries = $quarters[$q];

                if (count($entries)) {
                    include("entry_stats.php");

                    $chart_range = iso8601("$year-" . str_pad($q + 33, 2, "0", STR_PAD_LEFT));
                    include("entry_chart.php");
                }
                ?>
            </div>
        <?php endif; ?>

    <?php endfor; ?>

</div>