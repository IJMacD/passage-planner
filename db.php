<?php

$conf = parse_ini_file("conf.ini");

$options = [
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
];

$db = new PDO($conf['database_dsn'].";charset=utf8mb4", $conf['database_user'], $conf['database_pass'], $options);