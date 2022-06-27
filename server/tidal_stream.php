<?php

$date = date("Y-m-d");
$start_dt = "$date%2000:00:00";
$end_dt = "$date%2023:45:00";
$average = false;
$mode = $average ? "Average" : "Surface";
$url = "https://current.hydro.gov.hk/en/download_csv.php?start_dt=$start_dt&end_dt=$end_dt&mode=$mode";

echo "fetching: $url\n";

// $arrContextOptions=array(
//     "ssl"=>array(
//         "cafile"=>"/usr/lib/ssl/certs/ca-certificates.crt",
//         "verify_peer"=>true,
//         "verify_peer_name"=>true,
//     ),
// );
// $context = stream_context_create($arrContextOptions);
// $data = file_get_contents($url, false, $context);
// $data = file_get_contents($url);
$data = file_get_contents_curl($url);
$lines = explode("\n", $data);
$headers = array_shift($lines);

echo "headers: $headers\n";

echo "lines: " . count($lines) ."\n";

function file_get_contents_curl( $url ) {

    $ch = curl_init();

    curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt( $ch, CURLOPT_AUTOREFERER, TRUE );
    curl_setopt( $ch, CURLOPT_HEADER, 0 );
    curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
    curl_setopt( $ch, CURLOPT_URL, $url );
    curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, TRUE );
    curl_setopt( $ch, CURLOPT_SSL_CIPHER_LIST, 'TLSv1' );
    curl_setopt( $ch, CURLOPT_SSL_CIPHER_LIST, 'DEFAULT@SECLEVEL=1' );

    $data = curl_exec( $ch );

    if ($data === false) {
        echo curl_error($ch) . "\n";
        curl_close( $ch );
        exit;
    }

    curl_close( $ch );

    return $data;

}