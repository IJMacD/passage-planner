<?php

class AccessControl {
    static function allowOrigin ($origin) {
        if (!isset($_SERVER['HTTP_ORIGIN'])) {
            return;
        }

        if ($origin === "*" || $_SERVER['HTTP_ORIGIN'] === $origin) {
            header("Access-Control-Allow-Origin: $origin");
        }
    }

    static function allowMethod ($method) {
        if (!isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            return;
        }

        if ($method === "*" || strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']) === strtolower($method)) {
            header("Access-Control-Allow-Method: " . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']);
        }
    }

    static function allowHeader ($header) {
        if (!isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            return;
        }

        if ($header === "*" || strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']) === strtolower($header)) {
            header("Access-Control-Allow-Headers: " . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
        }
    }

    static function setMaxAge ($seconds) {
        if (strtolower($_SERVER['REQUEST_METHOD']) === "options") {
            header("Access-Control-Max-Age: " . $seconds);
        }
    }
}