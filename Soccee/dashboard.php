<?php
declare(strict_types=1);
require_once __DIR__ . "/includes/auth_check.php"; // redirects to login.php if not logged in

$stmt = get_db()->prepare("SELECT username, email, created_at FROM users WHERE id = :id");
$stmt->execute(['id' => $_SESSION['user_id']]);
$me = $stmt->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOCCEE — Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">
</head>
<body class="bg-white">
  <header class="soccee-topbar">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
      <a href="index.html" class="soccee-logo">SOCCEE</a>
      <div class="flex items-center gap-4">
        <span class="text-white text-sm">Hi, <?= htmlspecialchars($me['username'] ?? '') ?></span>
        <a href="logout.php" class="bg-white text-[#0d1b3e] font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition">Log out</a>
      </div>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-16 text-center">
    <h1 class="text-2xl font-bold mb-2">Welcome back, <?= htmlspecialchars($me['username'] ?? '') ?> 👋</h1>
    <p class="text-gray-500 mb-8">You're logged in as <?= htmlspecialchars($me['email'] ?? '') ?>.</p>
    <a href="index.html" class="nav-link-red">Back to matches →</a>
  </main>
</body>
</html>
