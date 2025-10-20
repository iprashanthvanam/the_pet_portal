document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let isAuthenticated = false;
    let isAdmin = false;

    // --- DOM Elements ---
    const appContainer = document.getElementById('app-container');
    const views = {
        home: document.getElementById('home-view'),
        login: document.getElementById('login-view'),
        register: document.getElementById('register-view'),
        admin: document.getElementById('admin-view'),
        addPetForm: document.getElementById('add-pet-form-section')
    };

    const navButtons = {
        register: document.getElementById('register-btn'),
        login: document.getElementById('login-btn'),
        logout: document.getElementById('logout-btn'),
        adminDashboard: document.getElementById('admin-dashboard-btn')
    };

    const forms = {
        login: document.getElementById('login-form'),
        register: document.getElementById('register-form'),
        addPet: document.getElementById('add-pet-form')
    };

    // --- Core Functions ---

    /** Shows one view and hides all others. */
    const showView = (viewName) => {
        Object.values(views).forEach(view => {
            if (view) {
                view.classList.add('hidden');
            }
        });
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }
    };

    /** Updates navigation buttons based on login state. */
    const updateNav = () => {
        if (isAuthenticated) {
            navButtons.register.style.display = 'none';
            navButtons.login.style.display = 'none';
            navButtons.logout.style.display = 'inline-block';
            navButtons.adminDashboard.style.display = isAdmin ? 'inline-block' : 'none';
        } else {
            navButtons.register.style.display = 'inline-block';
            navButtons.login.style.display = 'inline-block';
            navButtons.logout.style.display = 'none';
            navButtons.adminDashboard.style.display = 'none';
        }
    };

    /** Handles the login process simulation. */
    const handleLogin = (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Reset errors
        document.getElementById('login-username-error').textContent = '';
        document.getElementById('login-password-error').textContent = '';

        if (!username) {
             document.getElementById('login-username-error').textContent = 'Username is required.';
             return;
        }
        if (!password) {
             document.getElementById('login-password-error').textContent = 'Password is required.';
             return;
        }

        // --- SIMULATION LOGIC ---
        if (username === 'admin' && password === 'adminpass') {
            isAuthenticated = true;
            isAdmin = true;
            alert('Admin Login Successful!');
        } else if (username === 'user' && password === 'userpass') {
            isAuthenticated = true;
            isAdmin = false;
            alert('User Login Successful!');
        } else {
            alert('Invalid username or password.');
            return;
        }

        // Common post-login actions
        updateNav();
        showView('home');
    };

    /** Handles the logout process. */
    const handleLogout = () => {
        isAuthenticated = false;
        isAdmin = false;
        alert('Logged out.');
        updateNav();
        showView('home');
    };

    /** Handles the registration form validation. */
    const handleRegister = (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-password-confirm').value;

        let isValid = true;

        // Reset all errors
        document.querySelectorAll('#register-form .error-message').forEach(el => el.textContent = '');

        // Validation checks (basic)
        if (username.length < 5 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            document.getElementById('reg-username-error').textContent = 'Username must be 5+ characters (letters, digits, _)';
            isValid = false;
        }

        if (password.length < 8) {
            document.getElementById('reg-password-error').textContent = 'Password must be at least 8 characters.';
            isValid = false;
        }

        if (password !== passwordConfirm) {
            document.getElementById('reg-password-confirm-error').textContent = 'Passwords do not match.';
            isValid = false;
        }

        if (isValid) {
            // Simulate successful registration
            alert(`Registration successful for ${username}. Please login.`);
            forms.register.reset();
            showView('login');
        }
    };
    
    /** Displays the Add Pet form within the Admin view. */
    window.showAddPetForm = (e) => {
        e.preventDefault();
        views.addPetForm.classList.remove('hidden');
        // Simple visual cue: scroll to the form
        views.addPetForm.scrollIntoView({ behavior: 'smooth' });
    };

    /** Handles the Add Pet form submission. */
    const handleAddPet = (e) => {
        e.preventDefault();
        
        // Basic form data collection
        const petName = document.getElementById('pet-name').value;
        const petSpecies = document.getElementById('pet-species').value;
        
        if (!petName || !petSpecies) {
            alert('Please fill out Name and Species.');
            return;
        }
        
        // --- SIMULATION ---
        alert(`Pet added (Simulated): Name: ${petName}, Species: ${petSpecies}`);
        
        // Reset form after submission
        forms.addPet.reset();
        views.addPetForm.classList.add('hidden'); // Hide after saving
        showView('home'); // Redirect to home page (or admin dashboard if desired)
    };
    
    // --- Event Listeners ---
    
    // Navigation Clicks
    navButtons.register.addEventListener('click', () => showView('register'));
    navButtons.login.addEventListener('click', () => showView('login'));
    navButtons.logout.addEventListener('click', handleLogout);
    navButtons.adminDashboard.addEventListener('click', () => {
        if (isAdmin) {
            showView('admin');
            // Hide pet form when returning to main admin dashboard
            views.addPetForm.classList.add('hidden');
        } else {
            alert('Access denied.');
            showView('home');
        }
    });

    // Form Submissions
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);
    forms.addPet.addEventListener('submit', handleAddPet);

    // --- Initialization ---
    updateNav();
    showView('home'); // Start on the home page
});