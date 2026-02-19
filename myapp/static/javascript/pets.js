document.addEventListener('DOMContentLoaded', function() {

    /* 1. Mobile Menu Toggle */
    window.toggleMenu = function() {
        const navLinks = document.getElementById('navLinks');
        navLinks.classList.toggle('active');
    }