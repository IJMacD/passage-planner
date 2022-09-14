<?php

class Auth {
    private static $auth_pass = "EXgCQzjpqFCpXinTquoCVfSFTsiFhU";

    static function handleGenerate () {
        if (!isset($_POST['user']) && !isset($_POST['pass'])) {
            header("HTTP/1.1 400 Bad Request");
            exit;
        }

        if ($_POST['user'] !== "auth_user" || $_POST['pass'] !== self::$auth_pass) {
            header("HTTP/1.1 400 Bad Request");
            exit;
        }

        $token = random_str();

        $expires = new DateTime("+1 year");

        $result = [
            "token" => $token,
            "expires" => $expires->format(DateTime::RFC3339),
            "user" => $_POST['user'],
            "type" => "refresh",
        ];

        global $db;

        $stmt = $db->prepare("INSERT INTO api_keys (`token`, `expires`, `user`, `type`) VALUES (:token, :expires, :user, :type)");

        $stmt->execute($result);

        header("Content-Type: application/json");
        echo json_encode($result);
    }

    static function handleExchange () {
        if (!isset($_POST['token'])) {
            header("HTTP/1.1 400 Bad Request");
            exit;
        }

        global $db;

        $stmt = $db->prepare("SELECT `user` FROM api_keys WHERE `token` = :token AND `type` = 'refresh' AND `expires` > NOW()");

        $stmt->execute(["token" => $_POST['token']]);

        $user = $stmt->fetchColumn();

        $token = random_str();

        $expires = new DateTime("+1 hour");

        $result = [
            "token" => $token,
            "expires" => $expires->format(DateTime::RFC3339),
            "user" => $user,
            "type" => "access",
        ];

        $stmt = $db->prepare("INSERT INTO api_keys (`token`, `expires`, `user`, `type`) VALUES (:token, :expires, :user, :type)");

        $stmt->execute($result);

        header("Content-Type: application/json");
        echo json_encode($result);

    }

    static function handleVerify () {
        if (!isset($_POST['token'])) {
            header("HTTP/1.1 400 Bad Request");
            exit;
        }

        $result = self::verifyToken($_POST['token']);

        header("Content-Type: application/json");
        echo json_encode($result);
    }

    static function verifyHeader () {
        if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
            header("HTTP/1.1 401 Unauthorized");
            exit;
        }

        if (strpos($_SERVER['HTTP_AUTHORIZATION'], "Bearer ") !== 0) {
            header("HTTP/1.1 401 Unauthorized");
            exit;
        }

        return self::verifyToken(substr($_SERVER['HTTP_AUTHORIZATION'], 7));
    }

    static function verifyToken ($token) {
        global $db;

        $stmt = $db->prepare("SELECT `user`, `type`, `expires` FROM api_keys WHERE `token` = :token AND `expires` > NOW()");

        $stmt->execute(["token" => $token]);

        if ($stmt->rowCount() === 0) {
            return false;
        }

        return $stmt->fetch();
    }

    static function maintenance () {
        global $db;

        $db->exec("DELETE FROM api_keys WHERE expires < NOW()");
    }
}

/**
 * Generate a random string, using a cryptographically secure
 * pseudorandom number generator (random_int)
 *
 * This function uses type hints now (PHP 7+ only), but it was originally
 * written for PHP 5 as well.
 *
 * For PHP 7, random_int is a PHP core function
 * For PHP 5.x, depends on https://github.com/paragonie/random_compat
 *
 * @param int $length      How many characters do we want?
 * @param string $keyspace A string of all possible characters
 *                         to select from
 * @return string
 */
function random_str(
    int $length = 64,
    string $keyspace = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
    if ($length < 1) {
        throw new \RangeException("Length must be a positive integer");
    }
    $pieces = [];
    $max = mb_strlen($keyspace, '8bit') - 1;
    for ($i = 0; $i < $length; ++$i) {
        $pieces []= $keyspace[random_int(0, $max)];
    }
    return implode('', $pieces);
}