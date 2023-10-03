<!DOCTYPE html>
<html>
    <head>
        <title><?=$title?></title>
        <link rel="stylesheet" href="/logbook/static/css/style.css" />
        <?php if(isset($description)): ?><meta name="description" content="<?=$description?>"><?php endif; ?>
    </head>
    <body>
        <nav>
            <a class="brand" href="/logbook"><h1>Logbook</h1></a>
        </nav>
        <main>
            <?=$content?>
        </main>
    </body>
</html>