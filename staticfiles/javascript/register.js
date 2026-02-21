/* =========================================
   REGISTER PAGE JAVASCRIPT
   ========================================= */

// 1. Mobile Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

// 2. Password Visibility Toggle (Scope Safe)
window.togglePassword = function(fieldId, btn) {
    const input = document.getElementById(fieldId);

    if (input) {
        // Toggle Type
        if (input.type === 'password') {
            input.type = 'text';
            btn.classList.add('active'); // CSS handles color change
        } else {
            input.type = 'password';
            btn.classList.remove('active');
        }
    }
};

// 3. Real-time Password Validation
document.addEventListener('DOMContentLoaded', function() {
    const pass1 = document.getElementById('password1');
    const pass2 = document.getElementById('password2');
    const feedback = document.getElementById('match-feedback');
    const reqLength = document.getElementById('req-length');
    const reqNumber = document.getElementById('req-number');

    // Check Complexity
    if (pass1) {
        pass1.addEventListener('input', function() {
            const val = pass1.value;
            
            // Length Check
            if (val.length >= 8) {
                reqLength.classList.add('valid');
                reqLength.classList.remove('invalid');
            } else {
                reqLength.classList.remove('valid');
                reqLength.classList.add('invalid');
            }

            // Number Check
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

    // Check Match
    if (pass2) {
        pass2.addEventListener('input', checkMatch);
    }

    function checkMatch() {
        if (!pass1 || !pass2) return;

        const val1 = pass1.value;
        const val2 = pass2.value;

        if (val2.length === 0) {
            feedback.textContent = "";
            pass2.style.borderColor = "#e2e8f0";
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
});