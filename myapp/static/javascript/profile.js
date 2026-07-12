// Mobile menu toggle logic
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        const form = document.getElementById("profileForm");

        // Load profile data
        fetch("/api/profile/")
            .then(res => res.json())
            .then(data => {
                document.getElementById("id_first_name").value = (data.user && data.user.first_name) || "";
                document.getElementById("id_last_name").value = (data.user && data.user.last_name) || "";
                document.getElementById("id_email").value = (data.user && data.user.email) || "";
                document.getElementById("id_phone").value = data.phone || "";
                document.getElementById("id_address").value = data.address || "";
                document.getElementById("id_city").value = data.city || "";
                document.getElementById("id_postal_code").value = data.postal_code || "";

                if (data.profile_image) {
                    const avatar = document.querySelector(".profile-avatar-lg") || document.querySelector(".profile-header img");
                    if (avatar) {
                        if (avatar.tagName === 'IMG') {
                            avatar.src = data.profile_image;
                        } else {
                            // Replace block with img
                            const img = document.createElement("img");
                            img.src = data.profile_image;
                            img.alt = "Profile Avatar";
                            img.className = "profile-avatar-lg";
                            avatar.parentNode.replaceChild(img, avatar);
                        }
                    }
                }
            })
            .catch(err => console.error("Error loading user profile:", err));

        // Submit form data
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            const submitBtn = form.querySelector('.btn-update');
            const originalBtnHtml = submitBtn.innerHTML;
            
            // Set Loading spinner state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Saving...';
            
            const formData = new FormData(form);

            fetch("/api/profile/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                    console.error(data.error);
                } else {
                    // Preload saving visual brief moment before reloading
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            })
            .catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
                console.error("Error updating profile:", err);
            });
        });

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
    });