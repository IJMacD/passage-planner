<?php

if (isset($_GET['location'])) {
    $data = getForecast($_GET['location']);

    if ($data) {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/json");
        header("Cache-Control: public, max-age=60");
        echo $data;
        exit;
    }

}

header("HTTP/1.1 400 Bad Request");
echo "Bad Request";

function getForecast ($location) {
    $url = "https://maps.hko.gov.hk/ocf/dat/$location.xml";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    // curl_setopt($ch, CURLOPT_HEADER, 1);

    $result = curl_exec($ch);

    if (!$result) {
        header("HTTP/1.1 500 Server error");
        echo curl_error($ch);
        exit;
    }

    return $result;
}
