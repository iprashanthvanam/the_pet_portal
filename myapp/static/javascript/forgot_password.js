// --- Mobile Sidebar Toggle Logic ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// --- Upgraded Password Visibility Toggle (Using Locked FA Icons) ---
function togglePassword(fieldId, btn) {
    const input = document.getElementById(fieldId);
    const icon = btn.querySelector('i');
    
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
            btn.classList.add('active'); 
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            btn.classList.remove('active'); 
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    }
}

// Bind toggles to window
window.togglePassword = togglePassword;

// Helper to get CSRF token dynamically from cookie or DOM
function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === ('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue || document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

document.addEventListener("DOMContentLoaded", function () {
    const forgotEmailForm = document.getElementById("forgotEmailForm");
    const forgotOtpForm = document.getElementById("forgotOtpForm");
    const forgotResetForm = document.getElementById("forgotResetForm");
    
    const resetOtpFeedback = document.getElementById("reset-otp-feedback");
    
    let resetEmail = "";

    // Forgot Password - Step 1: Send Email
    forgotEmailForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = document.getElementById("reset_email").value;

        fetch("/api/forgot-password/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken()
            },
            body: JSON.stringify({ email: email })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                resetEmail = email;
                forgotEmailForm.style.display = "none";
                forgotOtpForm.style.display = "block";
                if (data.dev_otp) {
                    document.getElementById("reset_otp").value = data.dev_otp;
                    resetOtpFeedback.textContent = "Developer Mode: OTP automatically pre-filled (No SMTP configured).";
                    resetOtpFeedback.className = "form-text text-success";
                } else {
                    resetOtpFeedback.textContent = "OTP code has been sent to your email.";
                    resetOtpFeedback.className = "form-text text-muted";
                }
            }
        })
        .catch(err => {
            console.error("Forgot password error:", err);
            alert("An error occurred. Please try again.");
        });
    });

    // Forgot Password - Step 2: Verify OTP
    forgotOtpForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const otp = document.getElementById("reset_otp").value;

        fetch("/api/verify-reset-otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken()
            },
            body: JSON.stringify({
                email: resetEmail,
                otp: otp
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                resetOtpFeedback.textContent = data.error;
                resetOtpFeedback.className = "form-text text-danger";
            } else {
                forgotOtpForm.style.display = "none";
                forgotResetForm.style.display = "block";
            }
        })
        .catch(err => {
            console.error("OTP verification error:", err);
            resetOtpFeedback.textContent = "Error verifying OTP. Please try again.";
            resetOtpFeedback.className = "form-text text-danger";
        });
    });

    // Forgot Password - Step 3: Reset & Login
    forgotResetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const pass1 = document.getElementById("reset_password1").value;
        const pass2 = document.getElementById("reset_password2").value;

        if (pass1 !== pass2) {
            alert("Passwords do not match!");
            return;
        }

        fetch("/api/reset-password/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken()
            },
            body: JSON.stringify({
                email: resetEmail,
                password: pass1
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert("Password reset successful! Logging you in...");
                window.location.href = data.redirect_url;
            }
        })
        .catch(err => {
            console.error("Password reset error:", err);
            alert("An error occurred during password reset. Please try again.");
        });
    });
});
