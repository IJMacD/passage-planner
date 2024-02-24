<?php global $baseURL; ?>
<!DOCTYPE html>
<html>

<head>
    <title><?= $title ?></title>
    <?php if (isset($baseURL)) : ?>
        <base href="<?= $baseURL ?>">
    <?php endif; ?>
    <link rel="stylesheet" href="/static/css/style.css" />
    <?php if (isset($description)) : ?>
        <meta name="description" content="<?= $description ?>">
    <?php endif; ?>
</head>

<body>
    <nav>
        <a class="brand" href="/">
            <h1>Logbook</h1>
        </a>
    </nav>
    <main>
        <?= $content ?>
    </main>
</body>

</html>