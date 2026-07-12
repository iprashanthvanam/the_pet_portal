// Mobile menu toggle logic
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        loadAppointments();

        function loadAppointments() {
            const container = document.getElementById("appointments-container");
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted)">Loading appointments...</p>`;

            fetch("/api/bookings/doctor/")
                .then(res => res.json())
                .then(data => {
                    container.innerHTML = "";
                    if (data.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon"><i class="fa-regular fa-calendar-xmark"></i></div>
                                <h3>No Appointments Yet</h3>
                                <p>It looks like you haven't booked any veterinary appointments for your pets.</p>
                                <a href="/consult-doctor/" class="btn-new-appointment" style="margin-top: 15px;">
                                    Book an Appointment
                                </a>
                            </div>
                        `;
                        return;
                    }

                    data.forEach(app => {
                        let footerHtml = "";
                        if (app.status === "PENDING") {
                            footerHtml = `
                                <div class="appointment-footer">
                                    <button class="btn-cancel" onclick="cancelAppointment(${app.id})">
                                        <i class="fa-solid fa-xmark"></i> Cancel Appointment
                                    </button>
                                </div>
                            `;
                        }

                        container.innerHTML += `
                            <div class="appointment-card">
                                <div class="appointment-header">
                                    <div>
                                        <h3><i class="fa-solid fa-stethoscope"></i> ${app.pet_name}</h3>
                                        <div class="pet-type">${app.pet_type}</div>
                                    </div>
                                    <span class="status-badge status-${app.status.toLowerCase()}">
                                        ${app.status}
                                    </span>
                                </div>

                                <div class="appointment-body">
                                    <div class="info-item">
                                        <i class="fa-regular fa-calendar"></i>
                                        <span><strong>Date:</strong> ${new Date(app.appointment_date).toLocaleDateString()}</span>
                                    </div>
                                    <div class="info-item">
                                        <i class="fa-regular fa-clock"></i>
                                        <span><strong>Time:</strong> ${app.appointment_time}</span>
                                    </div>
                                    <div class="info-item" style="margin-top: 5px;">
                                        <i class="fa-solid fa-notes-medical"></i>
                                        <span><strong>Reason / Symptoms:</strong></span>
                                    </div>
                                    <div class="symptoms-box">
                                        ${app.symptoms}
                                    </div>
                                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px; text-align: right;">
                                        Booked on: ${new Date(app.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                ${footerHtml}
                            </div>
                        `;
                    });
                })
                .catch(err => console.error("Error loading doctor appointments:", err));
        }

        window.cancelAppointment = function (id) {
            if (!confirm("Are you sure you want to cancel this appointment?")) return;
            fetch(`/api/bookings/doctor/${id}/cancel/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                loadAppointments();
            })
            .catch(err => console.error("Cancel appointment error:", err));
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