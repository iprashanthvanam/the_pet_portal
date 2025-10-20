// document.addEventListener('DOMContentLoaded', function() {
//     const form = document.querySelector('form');
//     if (form) {
//         form.addEventListener('submit', function(event) {
//             event.preventDefault(); // Prevent default form submission
//             // Simulate form submission (in a real app, use AJAX)
//             const formData = new FormData(form);
//             fetch(form.action, {
//                 method: 'POST',
//                 body: formData,
//                 headers: {
//                     'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
//                 }
//             })
//             .then(response => response.url)
//             .then(url => {
//                 if (url.includes('/login/')) {
//                     alert('Successfully registered! Redirecting to Login...');
//                     window.location.href = url; // Redirect to login page
//                 }
//             })
//             .catch(error => console.error('Error:', error));
//         });
//     }
// });

// // Function to get CSRF token from cookies
// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }























document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') // Include CSRF token
                }
            })
            .then(response => {
                if (response.ok) {
                    alert('Successfully registered! Redirecting to Login...');
                    window.location.href = '/login/';
                } else {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Registration failed.');
                    });
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }
});

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}