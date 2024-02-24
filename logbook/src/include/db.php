<?php

define("FORMAT_SQL_DATE", "Y-m-d H:i:s");

$options = [
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
];

$db = new PDO(getenv("DATABASE_DSN") . ";charset=utf8mb4", getenv("DATABASE_USER"), getenv("DATABASE_PASS"), $options);
