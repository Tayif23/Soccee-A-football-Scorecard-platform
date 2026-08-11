<?php
/**
 * includes/auth_check.php
 * Include this at the very top of any page that must only be reachable
 * by a logged-in user (dashboard.php, etc). If there's no active session,
 * bounce straight to login.php before anything else on the page runs.
 */

declare(strict_types=1);

require_once __DIR__ . "/../config.php"; // starts the session

if (empty($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
