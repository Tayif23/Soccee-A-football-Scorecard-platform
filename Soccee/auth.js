// ============================================================================
// SOCCEE — auth.js
// Shared by login.php and register.php: real-time field validation and
// AJAX form submission. Every rule here is re-checked server-side too
// (see login.php / register.php) — client validation is for instant
// feedback, never the actual security boundary.
// ============================================================================

const RULES = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // At least 8 chars, one upper, one lower, one digit, one special char.
  passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
};

function setFieldState(inputEl, errorEl, valid, message) {
  inputEl.classList.remove("input-valid", "input-invalid");
  if (inputEl.value.length === 0) {
    errorEl.textContent = "";
    return;
  }
  inputEl.classList.add(valid ? "input-valid" : "input-invalid");
  errorEl.textContent = valid ? "" : message;
}

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

function renderPasswordMeter(meterEl, pw) {
  const score = passwordScore(pw);
  const segs = meterEl.querySelectorAll(".pw-meter-seg");
  segs.forEach((seg, i) => {
    seg.className = "pw-meter-seg";
    if (i < score) {
      if (score <= 2) seg.classList.add("filled-weak");
      else if (score <= 4) seg.classList.add("filled-fair");
      else seg.classList.add("filled-strong");
    }
  });
}

function wireLiveValidation({ usernameEl, emailEl, passwordEl, confirmEl, meterEl }) {
  if (usernameEl) {
    const err = document.getElementById(usernameEl.id + "Error");
    usernameEl.addEventListener("input", () =>
      setFieldState(usernameEl, err, RULES.username.test(usernameEl.value),
        "3–20 characters: letters, numbers, underscore only.")
    );
  }

  if (emailEl) {
    const err = document.getElementById(emailEl.id + "Error");
    emailEl.addEventListener("input", () =>
      setFieldState(emailEl, err, RULES.email.test(emailEl.value), "Enter a valid email address.")
    );
  }

  if (passwordEl) {
    const err = document.getElementById(passwordEl.id + "Error");
    passwordEl.addEventListener("input", () => {
      if (meterEl) renderPasswordMeter(meterEl, passwordEl.value);
      // On the login page we don't enforce strength (existing accounts may
      // pre-date the policy) — only on register.
      if (confirmEl !== undefined) {
        setFieldState(
          passwordEl,
          err,
          RULES.passwordStrong.test(passwordEl.value),
          "Min 8 characters incl. uppercase, lowercase, number & symbol."
        );
      } else if (err) {
        err.textContent = "";
        passwordEl.classList.remove("input-invalid", "input-valid");
      }
      if (confirmEl && confirmEl.value) confirmEl.dispatchEvent(new Event("input"));
    });
  }

  if (confirmEl) {
    const err = document.getElementById(confirmEl.id + "Error");
    confirmEl.addEventListener("input", () =>
      setFieldState(confirmEl, err, confirmEl.value === passwordEl.value && confirmEl.value.length > 0,
        "Passwords don't match.")
    );
  }
}

async function submitAuthForm(formEl, url, onResult) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = formEl.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Please wait…";

    const formData = new FormData(formEl);
    try {
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      onResult(data);
    } catch (err) {
      onResult({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
