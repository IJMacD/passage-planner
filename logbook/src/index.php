<?php
ini_set("display_errors", 1);

require_once "include/AccessControl.php";
require_once "include/Auth.php";
require_once "include/API.php";
require_once "include/Router.php";
require_once "include/Model/LogbookEntry.php";
require_once "include/Model/model.php";
require_once "include/Views/view.php";
require_once "include/util.php";
require_once "include/db.php";

$baseURL = getenv("BASE_URL") ?: "";

AccessControl::allowOrigin("http://localhost:3000");
AccessControl::allowMethod("post");
AccessControl::allowMethod("delete");
AccessControl::allowHeader("Authorization");
AccessControl::setMaxAge(60 * 60);

Auth::maintenance();

Router::setRoot("/");

Router::registerWithPrefix("/api/v1", [
    ["get",     "/logs/:hid.gpx",       ["API", "handleLogTrackGet"]],
    ["get",     "/logs/:hid/track",     ["API", "handleLogTrackGet"]],
    ["post",    "/logs/:hid/track",     ["API", "handleLogTrackPost"]],
    ["get",     "/logs/:hid/bounds",    ["API", "handleLogEntryBounds"]],
    ["get",     "/logs/:hid",           ["API", "handleLogEntryGet"]],
    ["post",    "/logs/:hid",           ["API", "handleLogEntryPost"]],
    ["delete",  "/logs/:hid",           ["API", "handleLogEntryDelete"]],
    ["get",     "/logs",                ["API", "handleLogsGet"]],
    ["post",    "/logs",                ["API", "handleLogsPost"]],
]);
Router::registerWithPrefix("/api/v1/auth", [
    ["get",     "/generate",    ["Auth", "handleGenerate"]],
    ["post",    "/generate",    ["Auth", "handleGenerate"]],
    ["post",    "/exchange",    ["Auth", "handleExchange"]],
    ["post",    "/verify",      ["Auth", "handleVerify"]],
]);
Router::register([
    ["get",     "/records",         fn () => handleRecords()],
    ["get",     "/calendar",        fn () => handleCalendar()],
    ["get",     "/calendar/:year",  fn ($year) => handleCalendar($year)],
    ["get",     "/stats",           fn () => handleStats()],
    ["get",     "/all",             fn () => handleAllTracks()],
    ["get",     "/extract/:date",   fn ($date) => handleExtract($date)],
    ["get",     "/:hid",            fn ($hid) => handleLogEntry(hexdec($hid))],
    ["get",     "/",                fn () => handleIndex()],
    ["get",     "",                 fn () => handleIndex()],
    ["options", "*",                fn () => null],
]);

try {
    if (!Router::execute()) {
        header("HTTP/1.1 404 Not Found");
        include "include/Views/404.php";
    }
} catch (PDOException $e) {
    header("HTTP/1.1 500 Server Error");
    print_r($e->getMessage());
} catch (Exception $e) {
    header("HTTP/1.1 500 Server Error");
    echo $e->getMessage();
}

function handleIndex()
{
    global $db;
    include "include/Views/LogbookIndex.php";
}

function handleExtract($dateSpec)
{
    global $db;
    include "include/Views/LogbookExtract.php";
}

function handleRecords()
{
    global $db;
    include "include/Views/LogbookRecords.php";
}


function handleCalendar($year = "")
{
    global $db;
    include "include/Views/LogbookCalendar.php";
}

function handleStats()
{
    global $db;
    include "include/Views/LogbookStats.php";
}

function handleAllTracks()
{
    global $db;
    include "include/Views/LogbookAllTracks.php";
}

function handleLogEntry($id)
{
    global $db;

    $entry = getEntry($db, $id);

    if (!$entry) {
        header("HTTP/1.1 404 Not Found");
        exit;
    }

    include "include/Views/LogbookSingle.php";
}
