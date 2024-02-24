# API Docs

## Create a Logbook Entry

    HTTP/1.1 POST /logbook/api/v1/logs
    Authorization: Bearer abcdef123456
    Content-Type: application/x-www-form-urlencoded

    total_distance=___&start_location=___&start_time=___&end_location=___&end_time=___&weather=___&comments=___

## Edit a Logbook Entry

    HTTP/1.1 POST /logbook/api/v1/logs/ff8000
    Authorization: Bearer abcdef123456
    Content-Type: application/x-www-form-urlencoded

    start_location=___&comments=___

## Upload a Logbook Track

    HTTP/1.1 POST /logbook/api/v1/logs/ff8000/track
    Authorization: Bearer abcdef123456
    Content-Type: multipart/form-data

    name=gpx;fileName

## Get a Refresh Token

    HTTP/1.1 POST /logbook/api/v1/auth/generate
    Content-Type: application/x-www-form-urlencoded

    user=___&pass=___

Response:

    HTTP/1.1 200
    Content-Type: application/json

    {"token":"___","expires":"2022-10-11T17:45:00Z","user":"___","type":"refresh"}

## Get a Bearer Token

    HTTP/1.1 POST /logbook/api/v1/auth/exchange
    Content-Type: application/x-www-form-urlencoded

    token=___

Response:

    HTTP/1.1 200
    Content-Type: application/json

    {"token":"___","expires":"2022-10-11T17:45:00Z","user":"___","type":"access"}



