/* =========================================
   LOGIN PAGE JAVASCRIPT
   ========================================= */

// 1. Mobile Menu Toggle
window.toggleMenu = function() {
    const menu = document.getElementById('navMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
};

// 2. Password Visibility Toggle
window.togglePassword = function(fieldId, btn) {
    const input = document.getElementById(fieldId);
    
    if (input) {
        if (input.type === 'password') {
            // Show Password
            input.type = 'text';
            btn.classList.add('active'); // Turn Purple
        } else {
            // Hide Password
            input.type = 'password';
            btn.classList.remove('active'); // Turn Gray
        }
    } else {
        console.error("Input field not found:", fieldId);
    }
};