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

// Bind toggles to window to ensure global scope accessibility
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
    const loginForm = document.getElementById("loginForm");

    // Standard Login
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const usernameEmail = document.getElementById("username_email").value;
        const password = document.getElementById("password").value;

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        fetch("/api/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken()
            },
            body: JSON.stringify({
                username_email: usernameEmail,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            if (data.error) {
                alert(data.error);
            } else {
                window.location.href = data.redirect_url;
            }
        })
        .catch(err => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            console.error("Login error:", err);
            alert("An error occurred during login. Please try again.");
        });
    });
});