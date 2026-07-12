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
    fetch("/api/dashboard/grooming/")
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

    dashboardData.bookings.forEach(g => {
        const petName = (g.pet_name || "").toLowerCase();
        if (searchVal && !petName.includes(searchVal)) {
            return;
        }
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-scissors" style="color: #ec4899"></i> Grooming Session</td>
                <td>Grooming package ${g.package_type} for ${g.pet_name} on ${new Date(g.appointment_datetime).toLocaleDateString()}</td>
                <td><span class="badge-status" style="background: rgba(236,72,153,0.2); color:#ec4899; padding:4px 10px; border-radius:20px; font-weight:600; font-size:11px;">${g.status}</span></td>
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
    let pending = 0, active = 0, completed = 0;

    dashboardData.bookings.forEach(booking => {
        if (booking.status === "PENDING") pending++;
        if (booking.status === "IN_PROGRESS") active++;
        if (booking.status === "COMPLETED") completed++;

        const petName = (booking.pet_name || "").toLowerCase();

        if (searchVal && !petName.includes(searchVal)) {
            return;
        }

        hasVisibleBookings = true;

        let actionButtons = `
            <button class="btn-moderate" onclick="openGroomingBookingModal(${booking.id})" style="padding: 4px 8px; font-size: 12px; margin-right:5px;"><i class="fa-solid fa-edit"></i> Edit</button>
        `;
        if (booking.status === "PENDING") {
            actionButtons += `
                <button class="btn-moderate" onclick="updateStatus(${booking.id}, 'APPROVED', this)" style="padding: 4px 8px; font-size: 12px; margin-right:5px; background:var(--secondary);">Approve</button>
                <button class="btn-moderate btn-danger" onclick="updateStatus(${booking.id}, 'CANCELLED', this)" style="padding: 4px 8px; font-size: 12px;">Reject</button>
            `;
        } else if (booking.status === "APPROVED") {
            actionButtons += `
                <button class="btn-moderate" onclick="updateStatus(${booking.id}, 'IN_PROGRESS', this)" style="padding: 4px 8px; font-size: 12px; margin-right:5px; background:var(--primary);">Start Grooming</button>
            `;
        } else if (booking.status === "IN_PROGRESS") {
            actionButtons += `
                <button class="btn-moderate" onclick="updateStatus(${booking.id}, 'COMPLETED', this)" style="padding: 4px 8px; font-size: 12px; margin-right:5px; background:#3b82f6; color:white;">Complete</button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>${booking.pet_name}</strong><br>
                    <span style="font-size: 12px; color: var(--text-muted)">${booking.pet_type} (${booking.pet_size})</span><br>
                    <span style="font-size: 12px; color: var(--primary)">${booking.package_type}</span>
                </td>
                <td>${booking.username}</td>
                <td>${booking.preferred_groomer || "Any Groomer"}</td>
                <td>
                    <strong>${new Date(booking.appointment_datetime).toLocaleDateString()}</strong><br>
                    <span style="font-size: 12px; color: var(--text-muted)">${new Date(booking.appointment_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td>
                    <strong>₹${booking.total_price}</strong><br>
                    <span style="font-size: 11px; color: var(--text-muted)">${booking.visit_type}</span>
                </td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}" style="font-size:12px; font-weight:600;">${booking.status.replace('_', ' ')}</span>
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    if (!hasVisibleBookings) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No grooming slots booked.</td></tr>`;
    }

    document.getElementById("stat-total").innerText = dashboardData.bookings.length;
    document.getElementById("stat-pending").innerText = pending;
    document.getElementById("stat-active").innerText = active;
    document.getElementById("stat-completed").innerText = completed;
}

window.updateStatus = function(bookingId, status, btnElement = null) {
    let originalHTML = "";
    if (btnElement) {
        originalHTML = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    }

    fetch(`/api/bookings/grooming/${bookingId}/status/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ status: status })
    })
    .then(res => res.json())
    .then(res => {
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
        console.error("Error updating status:", err);
    });
};

window.openGroomingBookingModal = function(id = null) {
    document.getElementById("grooming-booking-form").reset();
    document.getElementById("grooming-booking-id").value = id || "";

    if (id) {
        fetch(`/api/bookings/grooming/${id}/`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("grooming-booking-id").value = data.id;
                document.getElementById("groom-pet-name").value = data.pet_name;
                document.getElementById("groom-pet-type").value = data.pet_type;
                document.getElementById("groom-pet-size").value = data.pet_size;
                document.getElementById("groom-visit-type").value = data.visit_type;
                document.getElementById("groom-package").value = data.package_type;
                document.getElementById("groom-total-price").value = data.total_price;
                
                // Format datetime local input value
                function formatISO(dtStr) {
                    if(!dtStr) return "";
                    return dtStr.substring(0, 16);
                }
                document.getElementById("groom-date-time").value = formatISO(data.appointment_datetime);
                document.getElementById("groom-preferred").value = data.preferred_groomer || "";
                document.getElementById("groom-status").value = data.status;
                
                document.getElementById("grooming-booking-modal").style.display = "flex";
            })
            .catch(err => console.error("Error fetching grooming booking:", err));
    } else {
        document.getElementById("groom-status").value = "PENDING";
        document.getElementById("grooming-booking-modal").style.display = "flex";
    }
};

window.closeGroomingBookingModal = function() {
    document.getElementById("grooming-booking-modal").style.display = "none";
    document.getElementById("grooming-booking-form").reset();
};

window.saveGroomingBooking = function(e) {
    e.preventDefault();
    const id = document.getElementById("grooming-booking-id").value;
    const submitBtn = e.target.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Booking Details";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        pet_name: document.getElementById("groom-pet-name").value,
        pet_type: document.getElementById("groom-pet-type").value,
        pet_size: document.getElementById("groom-pet-size").value,
        visit_type: document.getElementById("groom-visit-type").value,
        package_type: document.getElementById("groom-package").value,
        total_price: document.getElementById("groom-total-price").value,
        appointment_datetime: document.getElementById("groom-date-time").value + "Z",
        preferred_groomer: document.getElementById("groom-preferred").value,
        status: document.getElementById("groom-status").value
    };

    let url = id ? `/api/bookings/grooming/${id}/` : `/api/bookings/grooming/`;
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
                throw new Error(errData.error || "Failed to save grooming booking");
            });
        }
        return res.json();
    })
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        closeGroomingBookingModal();
        loadDashboard();
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
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
                            <span style="background: var(--primary); color: white; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Groomer Reply</span>
                        </div>
                        <p style="color: var(--text-muted); margin: 0; line-height: 1.4; word-break: break-word; white-space: pre-wrap;">${reply.reply_text}</p>
                    </div>
                `;
            });
        }

        let replyFormHTML = `
            <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-top: 10px; display: flex; gap: 8px; width: 100%;">
                <input type="text" placeholder="Write reply as Groomer..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
                <button type="submit" class="btn-moderate" style="margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Reply</button>
            </form>
        `;

        let reviewImageHTML = "";
        const rMedia = [];
        if (review.image) rMedia.push({ type: 'image', url: review.image });
        if (review.video) rMedia.push({ type: 'video', url: review.video });
        if (review.media_files && review.media_files.length > 0) {
            review.media_files.forEach(mf => {
                rMedia.push({ type: mf.is_video ? 'video' : 'image', url: mf.file_url });
            });
        }

        if (rMedia.length > 0) {
            if (rMedia.length === 1) {
                const item = rMedia[0];
                if (item.type === 'video') {
                    reviewImageHTML = `
                        <div style="margin-top: 8px; max-width: 200px; height: 120px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                            <video src="${item.url}" controls style="width: 100%; height: 100%; object-fit: cover;"></video>
                        </div>
                    `;
                } else {
                    reviewImageHTML = `
                        <div style="margin-top: 8px;">
                            <img src="${item.url}" alt="Review photo" style="max-width: 120px; max-height: 120px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 1px solid var(--border-color);" onclick="window.open('${item.url}', '_blank')">
                        </div>
                    `;
                }
            } else {
                const carouselId = `review-carousel-${review.id}`;
                const slides = rMedia.map((m, idx) => {
                    if (m.type === 'video') {
                        return `
                            <div style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                <video src="${m.url}" controls muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                            </div>
                        `;
                    } else {
                        return `
                            <div style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                <img src="${m.url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${m.url}', '_blank')">
                            </div>
                        `;
                    }
                }).join('');

                let dotsHTML = '';
                rMedia.forEach((_, idx) => {
                    const offset = idx * -100;
                    const isActive = idx === 0 ? 'active' : '';
                    const bgColor = idx === 0 ? 'var(--primary)' : '#bbb';
                    dotsHTML += `<span class="carousel-dot ${isActive}" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(${offset}%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===${idx}?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: ${bgColor}; border-radius: 50%; display: inline-block; cursor: pointer;"></span>`;
                });

                reviewImageHTML = `
                    <div style="margin-top: 8px; position: relative; overflow: hidden; width: 160px; height: 120px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <div id="${carouselId}" style="display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                            ${slides}
                        </div>
                        <div style="position: absolute; bottom: 5px; width: 100%; text-align: center; z-index: 10;">
                            ${dotsHTML}
                        </div>
                    </div>
                `;
            }
        }

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
                    ${reviewImageHTML}
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
