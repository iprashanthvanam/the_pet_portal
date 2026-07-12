let dashboardData = null;

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});

window.switchPanel = function(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(`panel-${panelId}`).classList.add('active');
    
    const items = document.querySelectorAll('.nav-links .nav-item');
    items.forEach(item => {
        if (item.getAttribute('onclick').includes(panelId)) {
            item.classList.add('active');
        }
    });
};

function loadDashboard() {
    fetch("/api/dashboard/doctor/")
        .then(res => res.json())
        .then(data => {
            dashboardData = data;
            
            renderDashboardLogs();
            renderBookings();
            renderReviews();
        })
        .catch(err => console.error("Error loading dashboard data:", err));
}

// ==========================================
// 1. DASHBOARD LOGS SECTION
// ==========================================
window.filterLogs = function() {
    renderDashboardLogs();
};

function renderDashboardLogs() {
    if (!dashboardData) return;
    const searchVal = document.getElementById("search-logs").value.trim().toLowerCase();
    const tbody = document.getElementById("logs-tbody");
    tbody.innerHTML = "";

    let hasVisibleLogs = false;

    dashboardData.bookings.forEach(a => {
        const petName = (a.pet_name || "").toLowerCase();
        if (searchVal && !petName.includes(searchVal)) {
            return;
        }
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-stethoscope" style="color: #10b981"></i> Vet Consult</td>
                <td>Appointment for ${a.pet_name} on ${a.appointment_date} with ${a.username}</td>
                <td><span class="badge-status" style="background: rgba(16,185,129,0.2); color:#10b981; padding:4px 10px; border-radius:20px; font-weight:600; font-size:11px;">${a.status}</span></td>
            </tr>
        `;
    });

    if (!hasVisibleLogs) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">No matching logs found.</td></tr>`;
    }
}

// ==========================================
// 2. MANAGE BOOKINGS SECTION
// ==========================================
window.filterBookings = function() {
    renderBookings();
};

function renderBookings() {
    if (!dashboardData) return;
    const tbody = document.getElementById("bookings-tbody");
    tbody.innerHTML = "";

    const searchVal = document.getElementById("search-bookings").value.trim().toLowerCase();
    let hasVisibleBookings = false;
    let pending = 0, active = 0;

    dashboardData.bookings.forEach(booking => {
        if (booking.status === "PENDING") pending++;
        if (booking.status === "CONFIRMED") active++;

        const petName = (booking.pet_name || "").toLowerCase();
        const symptoms = (booking.symptoms || "").toLowerCase();

        if (searchVal && !petName.includes(searchVal) && !symptoms.includes(searchVal)) {
            return;
        }

        hasVisibleBookings = true;

        let actionButtons = `
            <button class="btn-moderate" onclick="openDoctorBookingModal(${booking.id})" style="padding: 4px 8px; font-size: 12px; margin-right:5px;"><i class="fa-solid fa-edit"></i> Edit</button>
        `;
        if (booking.status === "PENDING") {
            actionButtons += `
                <button class="btn-moderate" onclick="updateStatus(${booking.id}, 'CONFIRMED', this)" style="padding: 4px 8px; font-size: 12px; margin-right:5px; background:var(--secondary);">Confirm</button>
                <button class="btn-moderate btn-danger" onclick="updateStatus(${booking.id}, 'CANCELLED', this)" style="padding: 4px 8px; font-size: 12px;">Cancel</button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>${booking.pet_name}</strong><br>
                    <span style="font-size: 12px; color: var(--text-muted)">Species: ${booking.pet_type}</span>
                </td>
                <td>${booking.username}</td>
                <td>
                    <strong>${new Date(booking.appointment_date).toLocaleDateString()}</strong><br>
                    <span style="font-size: 12px; color: var(--text-muted)">Slot: ${booking.appointment_time}</span>
                </td>
                <td><span style="font-size: 13px;">${booking.symptoms}</span></td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}" style="font-size:12px; font-weight:600;">${booking.status}</span>
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    if (!hasVisibleBookings) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No consultations found.</td></tr>`;
    }

    document.getElementById("stat-total").innerText = dashboardData.bookings.length;
    document.getElementById("stat-pending").innerText = pending;
    document.getElementById("stat-active").innerText = active;
}

window.updateStatus = function(bookingId, status, btnElement = null) {
    let endpoint = status === 'CANCELLED' 
        ? `/api/bookings/doctor/${bookingId}/cancel/`
        : `/api/bookings/doctor/${bookingId}/status/`;

    let originalHTML = "";
    if (btnElement) {
        originalHTML = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }

    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ status: status })
    })
    .then(res => res.json())
    .then(data => {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHTML;
        }
        loadDashboard();
    })
    .catch(err => {
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHTML;
        }
        console.error("Error updating doctor consult status:", err);
    });
};

window.openDoctorBookingModal = function(id = null) {
    document.getElementById("doctor-booking-form").reset();
    document.getElementById("doctor-booking-id").value = id || "";
    
    if (id) {
        fetch(`/api/bookings/doctor/${id}/`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("doctor-booking-id").value = data.id;
                document.getElementById("doc-pet-name").value = data.pet_name;
                document.getElementById("doc-pet-type").value = data.pet_type;
                document.getElementById("doc-date").value = data.appointment_date;
                document.getElementById("doc-time").value = data.appointment_time.substring(0, 5);
                document.getElementById("doc-symptoms").value = data.symptoms;
                document.getElementById("doc-status").value = data.status;
                document.getElementById("doctor-booking-modal").style.display = "flex";
            })
            .catch(err => console.error("Error fetching doctor booking:", err));
    } else {
        document.getElementById("doc-status").value = "PENDING";
        document.getElementById("doctor-booking-modal").style.display = "flex";
    }
};

window.closeDoctorBookingModal = function() {
    document.getElementById("doctor-booking-modal").style.display = "none";
    document.getElementById("doctor-booking-form").reset();
};

window.saveDoctorBooking = function(e) {
    e.preventDefault();
    const id = document.getElementById("doctor-booking-id").value;
    const submitBtn = e.target.querySelector("button[type='submit']");
    const originalHTML = submitBtn ? submitBtn.innerHTML : "Save Appointment Details";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        pet_name: document.getElementById("doc-pet-name").value,
        pet_type: document.getElementById("doc-pet-type").value,
        appointment_date: document.getElementById("doc-date").value,
        appointment_time: document.getElementById("doc-time").value,
        symptoms: document.getElementById("doc-symptoms").value,
        status: document.getElementById("doc-status").value
    };

    let url = id ? `/api/bookings/doctor/${id}/` : `/api/bookings/doctor/`;
    let method = id ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.error || "Failed to save doctor booking");
            });
        }
        return res.json();
    })
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
        closeDoctorBookingModal();
        loadDashboard();
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
        alert(err.message);
    });
};

// ==========================================
// 3. REVIEW MODERATION SECTION
// ==========================================
window.renderReviews = function() {
    if (!dashboardData) return;
    const ratingFilter = document.getElementById("filter-rating").value;
    const tbody = document.getElementById("reviews-tbody");
    tbody.innerHTML = "";

    let filtered = dashboardData.reviews;
    if (ratingFilter) {
        filtered = filtered.filter(r => r.rating == ratingFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No reviews matching filters.</td></tr>`;
        return;
    }

    filtered.forEach(review => {
        let actionButtons = `
            <button class="btn-moderate btn-danger" onclick="deleteReview(${review.id})" style="padding:4px 8px; font-size:12px;">Delete</button>
        `;

        let repliesHTML = "";
        if (review.replies && review.replies.length > 0) {
            review.replies.forEach(reply => {
                repliesHTML += `
                    <div style="margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 13px; max-width: 100%;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 3px; color: var(--text-main);">
                            <span>${reply.username}</span>
                            <span style="background: var(--primary); color: white; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Doctor Reply</span>
                        </div>
                        <p style="color: var(--text-muted); margin: 0; line-height: 1.4; word-break: break-word; white-space: pre-wrap;">${reply.reply_text}</p>
                    </div>
                `;
            });
        }

        let replyFormHTML = `
            <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-top: 10px; display: flex; gap: 8px; width: 100%;">
                <input type="text" placeholder="Write reply as Doctor..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
                <button type="submit" class="btn-moderate" style="margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Reply</button>
            </form>
        `;

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong style="color: var(--primary);">${review.username}</strong><br>
                    <span style="font-size:11px; color:var(--text-muted)">${review.user_role}</span>
                </td>
                <td><span style="color: #f59e0b">${"⭐".repeat(review.rating)}</span></td>
                <td style="max-width: 400px; word-break: break-word; white-space: normal; line-height: 1.5; padding-bottom: 12px;">
                    <div style="margin-bottom: 8px; color: var(--text-main); font-weight: 500; word-break: break-word; white-space: pre-wrap;">
                        ${review.title ? `<strong>${review.title}</strong><br>` : ''}
                        ${review.comment}
                    </div>
                    <div class="replies-list" style="margin-top: 10px; max-width: 100%;">
                        ${repliesHTML}
                    </div>
                    ${replyFormHTML}
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
};

window.submitReviewReply = function(e, reviewId) {
    e.preventDefault();
    const form = e.target;
    const replyText = form.querySelector('input[type="text"]').value.trim();
    if (!replyText) return;

    fetch(`/api/reviews/${reviewId}/reply/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ reply_text: replyText })
    })
    .then(res => res.json())
    .then(data => {
        if (data.id) {
            form.reset();
            loadDashboard();
        } else {
            alert(JSON.stringify(data));
        }
    })
    .catch(err => console.error("Error submitting review reply:", err));
};

window.deleteReview = function(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    fetch(`/api/reviews/${reviewId}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        loadDashboard();
    })
    .catch(err => console.error("Error deleting review:", err));
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
