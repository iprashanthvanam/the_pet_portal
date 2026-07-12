// --- Mobile Sidebar Toggle Logic ---
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    // --- Upgraded Password Visibility Toggle (Using Locked FA Icons) ---
    window.togglePassword = function(fieldId, btn) {
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
    };

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

    // --- REAL-TIME PASSWORD VALIDATION & DYNAMIC API FLOW ---
    document.addEventListener('DOMContentLoaded', function() {
        const pass1 = document.getElementById('password1');
        const pass2 = document.getElementById('password2');
        const feedback = document.getElementById('match-feedback');
        const reqLength = document.getElementById('req-length');
        const reqNumber = document.getElementById('req-number');

        const registerForm = document.getElementById('registerForm');
        const otpForm = document.getElementById('otpForm');
        const otpFeedback = document.getElementById('otp-feedback');

        let registeredEmail = "";

        // Complexity Check
        if (pass1) {
            pass1.addEventListener('input', function() {
                const val = pass1.value;
                if (val.length >= 8) {
                    reqLength.classList.add('valid');
                    reqLength.classList.remove('invalid');
                } else {
                    reqLength.classList.remove('valid');
                    reqLength.classList.add('invalid');
                }

                if (/\d/.test(val)) {
                    reqNumber.classList.add('valid');
                    reqNumber.classList.remove('invalid');
                } else {
                    reqNumber.classList.remove('valid');
                    reqNumber.classList.add('invalid');
                }
                checkMatch();
            });
        }

        if (pass2) {
            pass2.addEventListener('input', checkMatch);
        }

        function checkMatch() {
            if (!pass1 || !pass2) return;
            const val1 = pass1.value;
            const val2 = pass2.value;

            if (val2.length === 0) {
                feedback.textContent = "";
                pass2.style.borderColor = "#e5e7eb";
                return;
            }

            if (val1 === val2) {
                feedback.textContent = "Passwords match!";
                feedback.className = "form-text text-success";
                pass2.style.borderColor = "var(--success)";
            } else {
                feedback.textContent = "Passwords do not match.";
                feedback.className = "form-text text-danger";
                pass2.style.borderColor = "var(--error)";
            }
        }

        // Form Submit flow
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            const first_name = document.getElementById('first_name').value;
            const last_name = document.getElementById('last_name').value;
            const phone = document.getElementById('phone').value;
            const password = pass1.value;

            if (pass1.value !== pass2.value) {
                alert("Passwords do not match!");
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...';

            fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    role: role,
                    first_name: first_name,
                    last_name: last_name,
                    phone: phone
                })
            })
            .then(res => res.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                if (data.error) {
                    alert(data.error);
                } else {
                    registeredEmail = email;
                    registerForm.style.display = 'none';
                    otpForm.style.display = 'block';
                    if (data.dev_otp) {
                        document.getElementById('otp').value = data.dev_otp;
                        otpFeedback.textContent = "Developer Mode: OTP automatically pre-filled (No SMTP configured).";
                        otpFeedback.className = "form-text text-success";
                    }
                }
            })
            .catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                console.error("Registration Error:", err);
                alert("An error occurred during registration. Please try again.");
            });
        });

        // OTP Verify Submit flow
        otpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const otp = document.getElementById('otp').value;

            fetch('/api/verify-otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    email: registeredEmail,
                    otp: otp
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    otpFeedback.textContent = data.error;
                } else {
                    // Redirect based on role dashboard returned from API
                    window.location.href = data.redirect_url;
                }
            })
            .catch(err => {
                console.error("OTP verification error:", err);
                otpFeedback.textContent = "Error verifying OTP. Please try again.";
            });
        });
    });