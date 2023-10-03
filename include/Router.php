<?php

class Router {
    private static $root = "/";
    private static $routes = [];

    static function setRoot ($root) {
        self::$root = $root;
    }

    /**
     * @param Array $routes [ $method: "get"|"post", $urlPattern: string, $handler: callable ][]
     */
    static function register ($routes) {
        foreach ($routes as $route) {
            self::$routes[] = $route;
        }
    }

    /**
     * @param string $prefix
     * @param Array $routes [ $method: "get"|"post", $urlPattern: string, $handler: callable ][]
     */
    static function registerWithPrefix ($prefix, $routes) {
        foreach ($routes as $route) {
            self::$routes[] = [ $route[0], $prefix . $route[1], $route[2] ];
        }
    }

    static function execute ($method = null, $path = null) {
        if ($method === null) {
            $method = strtolower($_SERVER['REQUEST_METHOD']);
        }

        if ($path === null) {
            $path = $_SERVER['REQUEST_URI'];
        }

        $queryPos = strpos($path, "?");
        if ($queryPos !== false) {
            $path = substr($path, 0, $queryPos);
        }

        foreach (self::$routes as $route) {
            if ($method !== $route[0]) {
                continue;
            }

            if ($route[1] === "*") {
                call_user_func($route[2]);
                return true;
            }

            $regex = "#^" . self::$root . preg_replace("#(^|/):[^/.]+#", "$1([^/.]+)", $route[1], -1, $param_count) . "#";

            if (preg_match($regex, $path, $matches)) {
                call_user_func($route[2], ...array_slice($matches, 1));
                return true;
            }
        }

        return false;
    }
}