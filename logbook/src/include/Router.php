<?php

class Router
{
    private static $root = "";
    private static $routes = [];

    static function setRoot($root)
    {
        // Root should start with slash
        // (but should not end in a slash)

        if ($root === "/") {
            return;
        }

        $root = rtrim($root, "/");
        if (!str_starts_with($root, "/")) {
            self::$root = "/" . $root;
        } else {
            self::$root = $root;
        }
    }

    /**
     * @param Array $routes [ $method: "get"|"post", $urlPattern: string, $handler: callable ][]
     */
    static function register($routes)
    {
        foreach ($routes as $route) {
            self::$routes[] = $route;
        }
    }

    /**
     * @param string $prefix
     * @param Array $routes [ $method: "get"|"post", $urlPattern: string, $handler: callable ][]
     */
    static function registerWithPrefix($prefix, $routes)
    {
        foreach ($routes as $route) {
            self::$routes[] = [$route[0], $prefix . $route[1], $route[2]];
        }
    }

    static function execute($method = null, $path = null)
    {
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

        // Sort routes for correct evaluation
        usort(self::$routes, function ($a, $b) {
            // Longest in terms of path parts first
            $a_parts = count(explode("/", $a[1]));
            $b_parts = count(explode("/", $b[1]));

            $d = $b_parts - $a_parts;

            if ($d !== 0) {
                return $d;
            }

            // Routes must be sorted with placeholders after literals

            $a_mod = str_replace(":", "\u{FFFC}", $a[1]);
            $b_mod = str_replace(":", "\u{FFFC}", $b[1]);

            return strcmp($a_mod, $b_mod);
        });

        $isExact = true;

        foreach (self::$routes as $route) {
            if ($method !== $route[0]) {
                continue;
            }

            if ($route[1] === "*") {
                call_user_func($route[2]);
                return true;
            }

            $regex = "#^" . self::$root . preg_replace("#(^|/):[^/.]+#", "$1([^/.]+)", $route[1], -1, $param_count) . ($isExact ? "$#" : "#");

            if (preg_match($regex, $path, $matches)) {
                call_user_func($route[2], ...array_slice($matches, 1));
                return true;
            }
        }

        return false;
    }
}
