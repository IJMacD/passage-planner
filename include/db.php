<?php

// Conf is stored in directory *above* webroot.
$path = dirname($_SERVER['DOCUMENT_ROOT']);

$conf = @parse_ini_file($path . "/conf.ini");

if ($conf === false) {
    echo "Unable to load conf";
    die;
}

define("FORMAT_SQL_DATE", "Y-m-d H:i:s");

$options = [
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
];

$db = new PDO($conf['database_dsn'].";charset=utf8mb4", $conf['database_user'], $conf['database_pass'], $options);