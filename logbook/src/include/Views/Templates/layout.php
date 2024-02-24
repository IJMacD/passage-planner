<?php global $baseURL; ?>
<!DOCTYPE html>
<html>

<head>
    <title><?= $title ?></title>
    <link rel="stylesheet" href="<?= $baseURL ?>/static/css/style.css" />
    <?php if (isset($description)) : ?>
        <meta name="description" content="<?= $description ?>">
    <?php endif; ?>
</head>

<body>
    <nav>
        <a class="brand" href="<?= $baseURL ?>/">
            <h1>Logbook</h1>
        </a>
    </nav>
    <main>
        <?= $content ?>
    </main>
</body>

</html>