<?php
declare(strict_types=1);
require_once __DIR__ . "/config.php";

// ---------------------------------------------------------------------------
// POST = the AJAX login attempt. Everything here is re-validated server-
// side even though auth.js already checked it client-side.
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    $email    = trim($_POST['email'] ?? '');
    $password = (string)($_POST['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Enter a valid email and password.']);
        exit;
    }

    $stmt = get_db()->prepare("SELECT id, password_hash FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    // Account not found in the database at all -> the exact message the
    // spec asked for.
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid Account']);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid Account']);
        exit;
    }

    // Prevent session fixation: regenerate the session ID on privilege change.
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];

    echo json_encode(['success' => true, 'redirect' => 'dashboard.php']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOCCEE — Login</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="styles.css">
</head>
<body class="bg-white">

  <div class="min-h-screen grid md:grid-cols-2">

    <!-- Left: form -->
    <div class="flex flex-col justify-center px-8 md:px-16 py-12 relative">
      <a href="index.html" class="absolute top-6 left-6 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">&#8592;</a>

      <div class="max-w-sm w-full mx-auto">
        <div class="text-center mb-6">
          <div class="soccee-logo text-3xl" style="color:#0d1b3e;">SOCCEE</div>
        </div>

        <h1 class="text-2xl font-bold text-center mb-1">Welcome Back!</h1>
        <p class="text-sm text-gray-500 text-center mb-6">Please sign in to continue</p>

        <div id="formAlert" class="hidden mb-4 text-sm text-center text-white bg-[#e21b1b] rounded-md py-2"></div>

        <form id="loginForm" novalidate>
          <label class="block text-sm font-medium mb-1" for="email">Email</label>
          <input id="email" name="email" type="email" placeholder="example@mail.com"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div id="emailError" class="field-error"></div>

          <label class="block text-sm font-medium mb-1 mt-3" for="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Password"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#0d1b3e]">
          <div id="passwordError" class="field-error"></div>

          <!-- "Remember me" / "Forgot Password" row removed per spec -->

          <button type="submit"
                  class="w-full bg-[#5b4fe8] hover:bg-[#4a3fd4] text-white font-semibold rounded-lg py-2.5 mt-4 transition">
            Login
          </button>

          <p class="text-center text-sm text-gray-500 mt-4">
            Not a member? <a href="register.php" class="text-[#5b4fe8] font-medium">Register Now</a>
          </p>
        </form>
      </div>
    </div>

    <!-- Right: side image — swap the URL below (or the CSS variable) to use your own -->
    <div class="hidden md:block auth-side-image"
         style="--auth-side-image: url('assets/login-side.jpg');"></div>
  </div>

  <script src="auth.js"></script>
  <script>
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    wireLiveValidation({ emailEl, passwordEl }); // no confirmEl -> strength meter/enforcement skipped on login

    const alertBox = document.getElementById('formAlert');
    submitAuthForm(document.getElementById('loginForm'), 'login.php', (data) => {
      if (data.success) {
        window.location.href = data.redirect;
      } else {
        alertBox.textContent = data.message || 'Invalid Account';
        alertBox.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
