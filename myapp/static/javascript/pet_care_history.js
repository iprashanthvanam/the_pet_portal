// Mobile menu toggle logic
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        loadBoardings();

        function loadBoardings() {
            const container = document.getElementById("bookings-container");
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted)">Loading reservations...</p>`;

            fetch("/api/bookings/care/")
                .then(res => res.json())
                .then(data => {
                    container.innerHTML = "";

                    // Calculate stats
                    let totalSpent = 0;
                    data.forEach(b => {
                        if (b.status !== 'CANCELLED') {
                            totalSpent += parseFloat(b.total_price || 0);
                        }
                    });

                    document.getElementById("stat-total-boarding").innerText = data.length;
                    document.getElementById("stat-total-spent").innerText = "₹" + totalSpent;

                    if (data.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon"><i class="fa-solid fa-house-chimney-crack"></i></div>
                                <h3>No Boarding History</h3>
                                <p>You haven't booked any pet care stays yet.</p>
                                <a href="/pet-care/" class="btn-new-booking" style="margin-top: 15px;">
                                    Book Pet Boarding
                                </a>
                            </div>
                        `;
                        return;
                    }

                    data.forEach(booking => {
                        let footerHtml = "";
                        if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
                            footerHtml = `
                                <div class="booking-footer">
                                    <button class="btn-cancel" onclick="cancelBooking(${booking.id})">
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
                                            <i class="fa-solid fa-paw"></i> ${booking.pet_name}
                                            <span class="species-tag">${booking.pet_species}</span>
                                        </h3>
                                    </div>
                                    <span class="status-badge status-${booking.status.toLowerCase()}">
                                        ${booking.status}
                                    </span>
                                </div>

                                <div class="booking-body">
                                    <div class="info-item">
                                        <i class="fa-regular fa-clock"></i>
                                        <div class="info-content" style="width: 100%;">
                                            <strong>Stay Duration</strong>
                                            <div class="date-flow">
                                                <span>${new Date(booking.start_datetime).toLocaleString()}</span>
                                                <i class="fa-solid fa-arrow-down"></i>
                                                <span>${new Date(booking.end_datetime).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="info-item" style="margin-top: 5px;">
                                        <i class="fa-regular fa-sun"></i>
                                        <div class="info-content">
                                            <strong>Total Days</strong>
                                            <span style="font-size: 14px; color: var(--text-main);">${booking.total_days} Days</span>
                                        </div>
                                    </div>

                                    <div class="info-item" style="margin-top: 5px;">
                                        <i class="fa-solid fa-file-invoice-dollar"></i>
                                        <div class="info-content">
                                            <strong>Total Price</strong>
                                            <span class="price-highlight">₹${booking.total_price}</span>
                                        </div>
                                    </div>
                                </div>
                                ${footerHtml}
                            </div>
                        `;
                    });
                })
                .catch(err => console.error("Error loading pet care boardings:", err));
        }

        window.cancelBooking = function (id) {
            if (!confirm("Are you sure you want to cancel this boarding reservation?")) return;
            fetch(`/api/bookings/care/${id}/cancel/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                loadBoardings();
            })
            .catch(err => console.error("Cancel boarding booking error:", err));
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