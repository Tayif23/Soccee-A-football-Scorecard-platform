<?php
declare(strict_types=1);
require_once __DIR__ . "/config.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    $username = trim($_POST['username'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = (string)($_POST['password'] ?? '');
    $confirm  = (string)($_POST['confirm_password'] ?? '');

    $usernameRule = '/^[a-zA-Z0-9_]{3,20}$/';
    $passwordRule = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/';

    if (!preg_match($usernameRule, $username)) {
        echo json_encode(['success' => false, 'message' => 'Username must be 3-20 characters: letters, numbers, underscore only.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Enter a valid email address.']);
        exit;
    }
    if (!preg_match($passwordRule, $password)) {
        echo json_encode(['success' => false, 'message' => 'Password needs 8+ characters incl. uppercase, lowercase, number & symbol.']);
        exit;
    }
    if ($password !== $confirm) {
        echo json_encode(['success' => false, 'message' => "Passwords don't match."]);
        exit;
    }

    $db = get_db();

    $check = $db->prepare("SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1");
    $check->execute(['email' => $email, 'username' => $username]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'That email or username is already registered.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT); // bcrypt, per-call random salt

    $insert = $db->prepare("INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :hash)");
    $insert->execute(['username' => $username, 'email' => $email, 'hash' => $hash]);

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$db->lastInsertId();

    echo json_encode(['success' => true, 'redirect' => 'dashboard.php']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOCCEE — Register</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">
</head>
<body class="bg-white">

  <div class="min-h-screen grid md:grid-cols-2">

    <div class="flex flex-col justify-center px-8 md:px-16 py-12 relative">
      <a href="login.php" class="absolute top-6 left-6 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">&#8592;</a>

      <div class="max-w-sm w-full mx-auto">
        <div class="text-center mb-6">
          <div class="soccee-logo text-3xl" style="color:#0d1b3e;">SOCCEE</div>
        </div>

        <h1 class="text-2xl font-bold text-center mb-1">Create Account</h1>
        <p class="text-sm text-gray-500 text-center mb-6">Join SOCCEE to follow every match</p>

        <div id="formAlert" class="hidden mb-4 text-sm text-center text-white bg-[#e21b1b] rounded-md py-2"></div>

        <form id="registerForm" novalidate>
          <label class="block text-sm font-medium mb-1" for="username">Username</label>
          <input id="username" name="username" type="text" placeholder="your_username"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div id="usernameError" class="field-error"></div>

          <label class="block text-sm font-medium mb-1 mt-3" for="email">Email</label>
          <input id="email" name="email" type="email" placeholder="example@mail.com"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div id="emailError" class="field-error"></div>

          <label class="block text-sm font-medium mb-1 mt-3" for="password">New Password</label>
          <input id="password" name="password" type="password" placeholder="New password"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div class="flex gap-1 mb-1" id="pwMeter">
            <div class="pw-meter-seg"></div><div class="pw-meter-seg"></div><div class="pw-meter-seg"></div>
            <div class="pw-meter-seg"></div><div class="pw-meter-seg"></div>
          </div>
          <div id="passwordError" class="field-error"></div>

          <label class="block text-sm font-medium mb-1 mt-3" for="confirm_password">Confirm New Password</label>
          <input id="confirm_password" name="confirm_password" type="password" placeholder="Confirm new password"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div id="confirm_passwordError" class="field-error"></div>

          <button type="submit"
                  class="w-full bg-[#5b4fe8] hover:bg-[#4a3fd4] text-white font-semibold rounded-lg py-2.5 mt-4 transition">
            Create Account
          </button>

          <p class="text-center text-sm text-gray-500 mt-4">
            Already have an account? <a href="login.php" class="text-[#5b4fe8] font-medium">Log In</a>
          </p>
        </form>
      </div>
    </div>

    <div class="hidden md:block auth-side-image"
         style="--auth-side-image: url('assets/login-side.jpg');"></div>
  </div>

  <script src="auth.js"></script>
  <script>
    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const confirmEl = document.getElementById('confirm_password');
    const meterEl = document.getElementById('pwMeter');
    wireLiveValidation({ usernameEl, emailEl, passwordEl, confirmEl, meterEl });

    const alertBox = document.getElementById('formAlert');
    submitAuthForm(document.getElementById('registerForm'), 'register.php', (data) => {
      if (data.success) {
        window.location.href = data.redirect;
      } else {
        alertBox.textContent = data.message || 'Something went wrong.';
        alertBox.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
