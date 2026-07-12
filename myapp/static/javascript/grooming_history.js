// Mobile menu toggle logic
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        loadGroomings();

        function loadGroomings() {
            const container = document.getElementById("bookings-container");
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted)">Loading grooming sessions...</p>`;

            fetch("/api/bookings/grooming/")
                .then(res => res.json())
                .then(data => {
                    container.innerHTML = "";
                    if (data.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon"><i class="fa-solid fa-bath"></i></div>
                                <h3>No Grooming History</h3>
                                <p>You haven't booked any grooming sessions for your pets yet.</p>
                                <a href="/grooming/" class="btn-new-booking" style="margin-top: 15px;">
                                    Book Pet Grooming
                                </a>
                            </div>
                        `;
                        return;
                    }

                    data.forEach(booking => {
                        let footerHtml = "";
                        if (booking.status === "PENDING" || booking.status === "APPROVED") {
                            footerHtml = `
                                <div class="booking-footer">
                                    <button class="btn-cancel" onclick="cancelGrooming(${booking.id})">
                                        <i class="fa-solid fa-xmark"></i> Cancel Booking
                                    </button>
                                </div>
                            `;
                        }

                        container.innerHTML += `
                            <div class="booking-card">
                                <div class="booking-header">
                                    <div>
                                        <h3>
                                            <i class="fa-solid fa-scissors"></i> ${booking.pet_name}
                                            <span class="species-tag">${booking.pet_type}</span>
                                        </h3>
                                    </div>
                                    <span class="status-badge status-${booking.status.toLowerCase()}">
                                        ${booking.status}
                                    </span>
                                </div>

                                <div class="booking-body">
                                    <div class="info-item">
                                        <i class="fa-solid fa-spa"></i>
                                        <div class="info-content">
                                            <strong>Package Selected</strong>
                                            <span style="font-size: 14px; color: var(--text-main);">
                                                ${booking.package_type}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="info-item">
                                        <i class="fa-solid fa-map-location-dot"></i>
                                        <div class="info-content">
                                            <strong>Visit Type</strong>
                                            <span>${booking.visit_type}</span>
                                        </div>
                                    </div>

                                    <div class="info-item">
                                        <i class="fa-regular fa-calendar-check"></i>
                                        <div class="info-content">
                                            <strong>Appointment Time</strong>
                                            <span>${new Date(booking.appointment_datetime).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div class="info-item" style="margin-top: 10px;">
                                        <i class="fa-solid fa-file-invoice-dollar"></i>
                                        <div class="info-content">
                                            <strong>Estimated Total</strong>
                                            <span class="price-highlight">₹${booking.total_price}</span>
                                        </div>
                                    </div>
                                </div>
                                ${footerHtml}
                            </div>
                        `;
                    });
                })
                .catch(err => console.error("Error loading grooming sessions:", err));
        }

        window.cancelGrooming = function (id) {
            if (!confirm("Are you sure you want to cancel this grooming booking?")) return;
            fetch(`/api/bookings/grooming/${id}/cancel/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                loadGroomings();
            })
            .catch(err => console.error("Cancel grooming session error:", err));
        };

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