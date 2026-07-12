let dashboardData = null;

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
    loadOrders();
    loadReviews();
    loadPets();
    loadFoods();
    loadAccessories();
    loadUsers();
    loadCartItems();
    loadHealthProfiles();
});

function switchPanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`panel-${panelId}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

let ordersData = [];

function loadDashboard() {
    fetch("/api/dashboard/master-admin/")
        .then(res => res.json())
        .then(data => {
            dashboardData = data;
            document.getElementById("stat-orders").innerText = data.orders.length;
            document.getElementById("stat-appointments").innerText = data.appointments.length;
            document.getElementById("stat-care").innerText = data.pet_care.length;
            document.getElementById("stat-grooming").innerText = data.grooming.length;
            renderDashboardLogs();
            renderBookings();
        })
        .catch(err => console.error("Error loading dashboard data:", err));
}

window.filterDashboardLogs = function() {
    renderDashboardLogs();
};

function renderDashboardLogs() {
    if (!dashboardData) return;
    const searchVal = document.getElementById("search-logs-order-id").value.trim().toLowerCase();
    const tbody = document.getElementById("logs-tbody");
    tbody.innerHTML = "";

    let hasVisibleLogs = false;

    dashboardData.orders.forEach(o => {
        const orderShortId = o.order_id.substring(0,8).toLowerCase();
        const orderFullId = o.order_id.toLowerCase();
        if (searchVal && !orderShortId.includes(searchVal) && !orderFullId.includes(searchVal)) {
            return;
        }
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-cart-shopping" style="color: #6366f1"></i> Purchase Order</td>
                <td>Order #${o.order_id.substring(0,8)} by ${o.full_name} for ₹${o.total_cost}</td>
                <td><span class="badge-status" style="background: rgba(99,102,241,0.2); color:#6366f1;">${o.status}</span></td>
            </tr>
        `;
    });

    dashboardData.appointments.forEach(a => {
        // Appointments don't have Order IDs, so hide them if search filters by Order ID
        if (searchVal) return;
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-stethoscope" style="color: #10b981"></i> Vet Consult</td>
                <td>Appointment for ${a.pet_name} on ${a.appointment_date} with ${a.username}</td>
                <td><span class="badge-status" style="background: rgba(16,185,129,0.2); color:#10b981;">${a.status}</span></td>
            </tr>
        `;
    });

    dashboardData.pet_care.forEach(c => {
        // Care bookings don't have Order IDs, so hide them if search filters by Order ID
        if (searchVal) return;
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-hotel" style="color: #f59e0b"></i> Boarding Care</td>
                <td>Boarding care for ${c.pet_name} starting ${new Date(c.start_datetime).toLocaleDateString()} with User ID ${c.user}</td>
                <td><span class="badge-status" style="background: rgba(245,158,11,0.2); color:#f59e0b;">${c.status}</span></td>
            </tr>
        `;
    });

    dashboardData.grooming.forEach(g => {
        // Grooming sessions don't have Order IDs, so hide them if search filters by Order ID
        if (searchVal) return;
        hasVisibleLogs = true;
        tbody.innerHTML += `
            <tr>
                <td><i class="fa-solid fa-scissors" style="color: #ec4899"></i> Grooming Session</td>
                <td>Grooming package ${g.package_type} for ${g.pet_name} on ${new Date(g.appointment_datetime).toLocaleDateString()}</td>
                <td><span class="badge-status" style="background: rgba(236,72,153,0.2); color:#ec4899;">${g.status}</span></td>
            </tr>
        `;
    });

    if (!hasVisibleLogs) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">No matching logs found.</td></tr>`;
    }
}

function loadOrders() {
    fetch("/api/orders/")
        .then(res => res.json())
        .then(data => {
            ordersData = data;
            renderOrders();
        });
}

window.filterOrders = function() {
    renderOrders();
};

function renderOrders() {
    const tbody = document.getElementById("orders-tbody");
    tbody.innerHTML = "";
    if (ordersData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No orders placed.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-orders").value.trim().toLowerCase();
    let hasVisibleOrders = false;

    ordersData.forEach(order => {
        const orderIdShort = order.order_id.substring(0, 8).toLowerCase();
        const orderIdFull = order.order_id.toLowerCase();
        const fullName = (order.full_name || "").toLowerCase();
        const email = (order.email || "").toLowerCase();
        const phone = (order.mobile_number || "").toLowerCase();

        if (searchVal) {
            const matchesId = orderIdShort.includes(searchVal) || orderIdFull.includes(searchVal);
            const matchesName = fullName.includes(searchVal);
            const matchesEmail = email.includes(searchVal);
            const matchesPhone = phone.includes(searchVal);

            if (!matchesId && !matchesName && !matchesEmail && !matchesPhone) {
                return;
            }
        }

        hasVisibleOrders = true;

        let actionButtons = `
            <select class="filter-select" onchange="updateOrderStatus('${order.order_id}', this.value)">
                <option value="">Select Stage...</option>
                <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected':''}>Confirmed</option>
                <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected':''}>Processing</option>
                <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected':''}>Shipped</option>
                <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected':''}>Delivered</option>
                <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected':''}>Cancelled</option>
            </select>
        `;

        tbody.innerHTML += `
            <tr>
                <td>
                    <strong>#${order.order_id.substring(0, 8)}</strong>
                    <button onclick="openOrderModal('${order.order_id}')" style="background:none; border:none; color:var(--primary); cursor:pointer; margin-left:5px;" title="Edit Order Details"><i class="fa-solid fa-edit"></i></button>
                </td>
                <td>
                    ${order.full_name}<br>
                    <span style="font-size:12px; color:var(--text-muted)">${order.email} | ${order.mobile_number}</span>
                </td>
                <td>₹${order.total_cost}</td>
                <td>
                    <span>${order.payment_method}</span><br>
                    <strong style="color: ${order.payment_status === 'PAID' ? '#10b981':'#f59e0b'}">${order.payment_status}</strong>
                </td>
                <td><span style="text-transform: uppercase;">${order.status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    if (!hasVisibleOrders) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No matching orders found.</td></tr>`;
    }
}

function openOrderModal(orderId) {
    fetch(`/api/orders/${orderId}/`)
        .then(res => res.json())
        .then(order => {
            document.getElementById("order-edit-id").value = order.order_id;
            document.getElementById("order-modal-id-subtitle").innerText = "ID: " + order.order_id;
            document.getElementById("order-fullname").value = order.full_name || "";
            document.getElementById("order-email").value = order.email || "";
            document.getElementById("order-mobile").value = order.mobile_number || "";
            document.getElementById("order-address").value = order.address || "";
            document.getElementById("order-city").value = order.city || "";
            document.getElementById("order-postal").value = order.postal_code || "";
            document.getElementById("order-paymethod").value = order.payment_method || "COD";
            document.getElementById("order-paystatus").value = order.payment_status || "UNPAID";
            document.getElementById("order-status").value = order.status || "CONFIRMED";
            document.getElementById("order-refund-id").value = order.razorpay_refund_id || "";
            document.getElementById("order-razorpay-order-id").value = order.razorpay_order_id || "";
            document.getElementById("order-razorpay-payment-id").value = order.razorpay_payment_id || "";
            
            function formatDT(val) {
                if (!val) return "";
                return val.substring(0, 16);
            }
            document.getElementById("order-confirmed-at").value = formatDT(order.confirmed_at);
            document.getElementById("order-processing-at").value = formatDT(order.processing_at);
            document.getElementById("order-shipped-at").value = formatDT(order.shipped_at);
            document.getElementById("order-delivered-at").value = formatDT(order.delivered_at);
            document.getElementById("order-cancelled-at").value = formatDT(order.cancelled_at);

            document.getElementById("order-modal").style.display = "flex";
        })
        .catch(err => console.error("Error fetching order:", err));
}

function closeOrderModal() {
    document.getElementById("order-modal").style.display = "none";
    document.getElementById("order-modal-form").reset();
}

function saveOrderDetails(e) {
    e.preventDefault();
    const orderId = document.getElementById("order-edit-id").value;
    const submitBtn = document.querySelector("#order-modal-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Order Details";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        full_name: document.getElementById("order-fullname").value,
        email: document.getElementById("order-email").value,
        mobile_number: document.getElementById("order-mobile").value,
        address: document.getElementById("order-address").value,
        city: document.getElementById("order-city").value,
        postal_code: document.getElementById("order-postal").value,
        payment_method: document.getElementById("order-paymethod").value,
        payment_status: document.getElementById("order-paystatus").value,
        status: document.getElementById("order-status").value,
        razorpay_refund_id: document.getElementById("order-refund-id").value,
        razorpay_order_id: document.getElementById("order-razorpay-order-id").value,
        razorpay_payment_id: document.getElementById("order-razorpay-payment-id").value,
        
        confirmed_at: document.getElementById("order-confirmed-at").value,
        processing_at: document.getElementById("order-processing-at").value,
        shipped_at: document.getElementById("order-shipped-at").value,
        delivered_at: document.getElementById("order-delivered-at").value,
        cancelled_at: document.getElementById("order-cancelled-at").value
    };

    fetch(`/api/orders/${orderId}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        if (data.order_id) {
            closeOrderModal();
            loadOrders();
            loadDashboard();
        } else {
            alert("Error updating order: " + JSON.stringify(data));
        }
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        console.error("Error saving order details:", err);
    });
}

function updateOrderStatus(orderId, status) {
    if (!status) return;
    fetch(`/api/orders/${orderId}/status/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ status: status })
    })
    .then(res => res.json())
    .then(res => {
        loadOrders();
        loadDashboard();
    })
    .catch(err => console.error("Error updating order status:", err));
}

function loadReviews() {
    const rating = document.getElementById("filter-rating").value;
    const reported = document.getElementById("filter-reported").value;

    let url = "/api/reviews/?";
    if (rating) url += `rating=${rating}&`;
    if (reported) url += `is_reported=${reported}&`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("reviews-tbody");
            tbody.innerHTML = "";
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No reviews matching filters.</td></tr>`;
                return;
            }

            data.forEach(review => {
                let targetAsset = "Generic Portal";
                if (review.pet) targetAsset = "Pet Listing";
                if (review.product) targetAsset = "Product (Food)";
                if (review.accessory) targetAsset = "Accessory";
                if (review.pet_care) targetAsset = "Pet Care Boarding";
                if (review.grooming) targetAsset = "Grooming";
                if (review.doctor_appointment) targetAsset = "Doctor Appointment";

                let actionButtons = "";
                if (review.is_reported) {
                    actionButtons += `
                        <button class="btn-moderate" onclick="moderateReview(${review.id}, 'approve')">Clear Flag</button>
                    `;
                }
                actionButtons += `
                    <button class="btn-moderate btn-danger" onclick="deleteReview(${review.id})">Delete</button>
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
                        // 2+ items: image and video slider carousel
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

                let repliesHTML = "";
                if (review.replies && review.replies.length > 0) {
                    review.replies.forEach(reply => {
                        const badge = reply.is_master_admin ? 
                            '<span style="background: var(--secondary); color: black; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Master Admin</span>' :
                            '<span style="background: var(--primary); color: white; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Seller Reply</span>';
                        
                        // Add Edit capabilities for Admin replies
                        let editBtnHTML = "";
                        if (reply.is_master_admin) {
                            editBtnHTML = `
                                <button type="button" onclick="toggleEditReplyForm(${review.id}, ${reply.id})" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 11px; margin-left: 10px; padding: 0; font-weight: 600;">Edit</button>
                            `;
                        }

                        repliesHTML += `
                            <div id="reply-container-${reply.id}" style="margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 13px; max-width: 100%; box-sizing: border-box;">
                                <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 3px; color: var(--text-main);">
                                    <span>${reply.username}</span>
                                    ${badge}
                                    ${editBtnHTML}
                                </div>
                                <p class="reply-text-content" style="color: var(--text-muted); margin: 0; line-height: 1.4; word-break: break-word; white-space: pre-wrap;">${reply.reply_text}</p>
                                
                                <form id="edit-reply-form-${reply.id}" onsubmit="submitEditReply(event, ${review.id}, ${reply.id})" style="display: none; margin-top: 8px; gap: 8px; width: 100%;">
                                    <input type="text" value="${reply.reply_text.replace(/"/g, '&quot;')}" required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                    <button type="submit" style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-weight: 600;">Save</button>
                                    <button type="button" onclick="toggleEditReplyForm(${review.id}, ${reply.id})" style="background: #374151; color: white; border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-weight: 600;">Cancel</button>
                                </form>
                            </div>
                        `;
                    });
                }

                let replyFormHTML = `
                    <form onsubmit="submitAdminReviewReply(event, ${review.id})" style="margin-top: 10px; display: flex; gap: 8px; width: 100%;">
                        <input type="text" placeholder="Write reply as Master Admin..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
                        <button type="submit" class="btn-moderate" style="margin: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Reply</button>
                    </form>
                `;

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <strong style="color: var(--primary); cursor: pointer; text-decoration: underline;" onclick="openUserModal(${review.user_profile_id})">${review.username}</strong><br>
                            <span style="font-size:11px; color:var(--text-muted)">${review.user_role}</span>
                        </td>
                        <td><span style="color: #f59e0b">${"⭐".repeat(review.rating)}</span></td>
                        <td style="max-width: 400px; word-break: break-word; white-space: normal; line-height: 1.5; padding-bottom: 12px;">
                            <div style="margin-bottom: 8px; color: var(--text-main); font-weight: 500; word-break: break-word; white-space: pre-wrap;">
                                ${review.title ? `<strong>${review.title}</strong><br>` : ''}
                                ${review.comment}
                            </div>
                            ${reviewImageHTML}
                            <div class="replies-list" style="margin-top: 10px; max-width: 100%; box-sizing: border-box;">
                                ${repliesHTML}
                            </div>
                            ${replyFormHTML}
                        </td>
                        <td>${targetAsset}</td>
                        <td>
                            <strong style="color: ${review.is_reported ? '#ef4444' : '#10b981'}">
                                ${review.is_reported ? 'FLAGGED / REPORTED' : 'CLEAN'}
                            </strong>
                        </td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
            });
        });
}

window.toggleEditReplyForm = function(reviewId, replyId) {
    const container = document.getElementById(`reply-container-${replyId}`);
    if (!container) return;
    const txt = container.querySelector(".reply-text-content");
    const form = document.getElementById(`edit-reply-form-${replyId}`);
    if (form.style.display === "none") {
        form.style.display = "flex";
        txt.style.display = "none";
    } else {
        form.style.display = "none";
        txt.style.display = "block";
    }
};

window.submitEditReply = function(event, reviewId, replyId) {
    event.preventDefault();
    const form = event.target;
    const replyText = form.querySelector('input[type="text"]').value.trim();
    if (!replyText) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    fetch(`/api/reviews/${reviewId}/reply/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            reply_id: replyId,
            reply_text: replyText
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(data => { throw new Error(data.error || "Failed to update reply") });
        }
        return res.json();
    })
    .then(data => {
        loadReviews(); // Reload to render edited reply
    })
    .catch(err => {
        alert(err.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
};

window.submitAdminReviewReply = function(event, reviewId) {
    event.preventDefault();
    const form = event.target;
    const replyText = form.querySelector('input[type="text"]').value.trim();
    if (!replyText) return;

    const submitBtn = form.querySelector('button');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    fetch(`/api/reviews/${reviewId}/reply/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ reply_text: replyText })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(data => { throw new Error(data.error || "Failed to submit reply") });
        }
        return res.json();
    })
    .then(data => {
        form.reset();
        loadReviews(); // Reload to render new reply
    })
    .catch(err => {
        alert(err.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
};

function moderateReview(reviewId, action) {
    fetch(`/api/reviews/${reviewId}/moderate/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ action: action })
    })
    .then(res => res.json())
    .then(res => {
        loadReviews();
    })
    .catch(err => console.error("Error moderating review:", err));
}

function deleteReview(reviewId) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    fetch(`/api/reviews/${reviewId}/moderate/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(res => {
        loadReviews();
    })
    .catch(err => console.error("Error deleting review:", err));
}

let petsData = [];
function loadPets() {
    fetch("/api/admin/pets/")
        .then(res => res.json())
        .then(data => {
            petsData = data;
            renderPets();
        });
}

window.filterPets = function() {
    renderPets();
};

function renderPets() {
    const tbody = document.getElementById("pets-tbody");
    tbody.innerHTML = "";
    if (petsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No pets listed.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-pets").value.trim().toLowerCase();
    let hasVisiblePets = false;

    petsData.forEach(pet => {
        const name = (pet.name || "").toLowerCase();
        const species = (pet.species || "").toLowerCase();
        const microchip = (pet.microchip_id || "").toLowerCase();

        if (searchVal) {
            const matchesName = name.includes(searchVal);
            const matchesSpecies = species.includes(searchVal);
            const matchesMicrochip = microchip.includes(searchVal);

            if (!matchesName && !matchesSpecies && !matchesMicrochip) {
                return;
            }
        }

        hasVisiblePets = true;
        const microchipDisplay = pet.microchip_id ? pet.microchip_id : "-";

        tbody.innerHTML += `
            <tr>
                <td><strong>${pet.name}</strong></td>
                <td>${pet.species}</td>
                <td><code style="font-family: monospace; font-size:13px; color: var(--secondary);">${microchipDisplay}</code></td>
                <td>₹${pet.price}</td>
                <td>
                    <button class="btn-moderate" onclick="openModal('pet', ${pet.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteItem('pet', ${pet.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisiblePets) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No matching pets found.</td></tr>`;
    }
}

let foodsData = [];
function loadFoods() {
    fetch("/api/admin/foods/")
        .then(res => res.json())
        .then(data => {
            foodsData = data;
            renderFoods();
        });
}

window.filterFoods = function() {
    renderFoods();
};

function renderFoods() {
    const tbody = document.getElementById("foods-tbody");
    tbody.innerHTML = "";
    if (foodsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No foods listed.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-foods").value.trim().toLowerCase();
    let hasVisibleFoods = false;

    foodsData.forEach(food => {
        const name = (food.name || "").toLowerCase();
        const type = (food.food_type || "").toLowerCase();

        if (searchVal) {
            const matchesName = name.includes(searchVal);
            const matchesType = type.includes(searchVal);

            if (!matchesName && !matchesType) {
                return;
            }
        }

        hasVisibleFoods = true;

        tbody.innerHTML += `
            <tr>
                <td><strong>${food.name}</strong></td>
                <td>${food.food_type}</td>
                <td>₹${food.price}</td>
                <td>
                    <button class="btn-moderate" onclick="openModal('food', ${food.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteItem('food', ${food.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleFoods) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No matching foods found.</td></tr>`;
    }
}

let accessoriesData = [];
function loadAccessories() {
    fetch("/api/admin/accessories/")
        .then(res => res.json())
        .then(data => {
            accessoriesData = data;
            renderAccessories();
        });
}

window.filterAccessories = function() {
    renderAccessories();
};

function renderAccessories() {
    const tbody = document.getElementById("accessories-tbody");
    tbody.innerHTML = "";
    if (accessoriesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No accessories listed.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-accessories").value.trim().toLowerCase();
    let hasVisibleAcc = false;

    accessoriesData.forEach(acc => {
        const name = (acc.name || "").toLowerCase();
        const category = (acc.category || "").toLowerCase();

        if (searchVal) {
            const matchesName = name.includes(searchVal);
            const matchesCategory = category.includes(searchVal);

            if (!matchesName && !matchesCategory) {
                return;
            }
        }

        hasVisibleAcc = true;

        tbody.innerHTML += `
            <tr>
                <td><strong>${acc.name}</strong></td>
                <td>${acc.category}</td>
                <td>₹${acc.price}</td>
                <td>
                    <button class="btn-moderate" onclick="openModal('accessory', ${acc.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteItem('accessory', ${acc.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleAcc) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No matching accessories found.</td></tr>`;
    }
}

function openModal(itemClass, id = null) {
    document.getElementById("modal-form").reset();
    document.getElementById("item-id").value = id || "";
    document.getElementById("item-class").value = itemClass;

    const extraPet = document.getElementById("extra-pet-fields");
    const extraFood = document.getElementById("extra-food-fields");
    const fieldSpecies = document.getElementById("field-species");
    const fieldCategory = document.getElementById("field-category");

    extraPet.style.display = "none";
    extraFood.style.display = "none";
    fieldSpecies.style.display = "block";
    fieldCategory.style.display = "none";

    if (itemClass === "pet") {
        document.getElementById("modal-title").innerText = id ? "Edit Pet" : "Add Pet";
        extraPet.style.display = "block";
    } else if (itemClass === "food") {
        document.getElementById("modal-title").innerText = id ? "Edit Food" : "Add Food Product";
        extraFood.style.display = "grid";
    } else if (itemClass === "accessory") {
        document.getElementById("modal-title").innerText = id ? "Edit Accessory" : "Add Accessory";
        fieldSpecies.style.display = "none";
        fieldCategory.style.display = "block";
    }

    if (id) {
        let endpoint = "";
        if (itemClass === "pet") endpoint = `/api/admin/pets/${id}/`;
        else if (itemClass === "food") endpoint = `/api/admin/foods/${id}/`;
        else if (itemClass === "accessory") endpoint = `/api/admin/accessories/${id}/`;

        fetch(endpoint)
            .then(res => res.json())
            .then(item => {
                document.getElementById("form-name").value = item.name;
                document.getElementById("form-species").value = item.species || item.food_type || "";
                document.getElementById("form-price").value = item.price;
                document.getElementById("form-description").value = item.description || "";

                if (itemClass === "accessory") {
                    document.getElementById("form-category").value = item.category || "TOY";
                }

                if (itemClass === "pet") {
                    document.getElementById("form-age").value = item.age || "";
                    document.getElementById("form-activity").value = item.activity_level || "";
                    document.getElementById("form-vaccinated").checked = item.vaccinated || false;
                    document.getElementById("form-adoption").checked = item.adoption_ready || false;
                } else if (itemClass === "food") {
                    document.getElementById("form-mfg").value = item.mfg_date || "";
                    document.getElementById("form-expiry").value = item.expire_date || "";
                }
            });
    }

    document.getElementById("item-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("item-modal").style.display = "none";
}

let isSavingItem = false;
function saveItem(e) {
    e.preventDefault();
    if (isSavingItem) return;
    isSavingItem = true;

    const id = document.getElementById("item-id").value;
    const itemClass = document.getElementById("item-class").value;
    const submitBtn = document.querySelector("#modal-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Changes";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    let formData = new FormData();
    formData.append("name", document.getElementById("form-name").value);
    formData.append("price", document.getElementById("form-price").value);
    formData.append("description", document.getElementById("form-description").value);

    const speciesVal = document.getElementById("form-species").value;
    if (itemClass === "pet") {
        formData.append("species", speciesVal);
        formData.append("age", document.getElementById("form-age").value);
        formData.append("activity_level", document.getElementById("form-activity").value);
        formData.append("vaccinated", document.getElementById("form-vaccinated").checked);
        formData.append("adoption_ready", document.getElementById("form-adoption").checked);
    } else if (itemClass === "food") {
        formData.append("food_type", speciesVal);
        formData.append("mfg_date", document.getElementById("form-mfg").value);
        formData.append("expire_date", document.getElementById("form-expiry").value);
    } else if (itemClass === "accessory") {
        formData.append("category", document.getElementById("form-category").value);
        formData.append("pet_type", "BOTH");
        formData.append("mrp", document.getElementById("form-price").value);
    }

    const imgFile = document.getElementById("form-image").files[0];
    if (imgFile) {
        formData.append("image", imgFile);
    }
    const img2File = document.getElementById("form-image2").files[0];
    if (img2File) {
        formData.append("image2", img2File);
    }
    const videoFile = document.getElementById("form-video").files[0];
    if (videoFile) {
        formData.append("video", videoFile);
    }

    let endpointFolder = itemClass + "s";
    if (itemClass === "accessory") {
        endpointFolder = "accessories";
    }

    let endpoint = `/api/admin/${endpointFolder}/`;
    let method = "POST";
    if (id) {
        endpoint = `/api/admin/${endpointFolder}/${id}/`;
        method = "PUT";
    }

    fetch(endpoint, {
        method: method,
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw err; });
        }
        return res.json();
    })
    .then(data => {
        isSavingItem = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        closeModal();
        document.getElementById("modal-form").reset();
        if (itemClass === "pet") loadPets();
        else if (itemClass === "food") loadFoods();
        else if (itemClass === "accessory") loadAccessories();
        loadDashboard();
    })
    .catch(err => {
        isSavingItem = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        alert("Failed to save item: " + JSON.stringify(err));
    });
}

function deleteItem(itemClass, id) {

    let endpointFolder = itemClass + "s";
    if (itemClass === "accessory") {
        endpointFolder = "accessories";
    }
    let endpoint = `/api/admin/${endpointFolder}/${id}/`;
    fetch(endpoint, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        if (itemClass === "pet") loadPets();
        else if (itemClass === "food") loadFoods();
        else if (itemClass === "accessory") loadAccessories();
        loadDashboard();
    })
    .catch(err => console.error("Error deleting item:", err));
}

let usersData = [];
function loadUsers() {
    fetch("/api/admin/users/")
        .then(res => res.json())
        .then(data => {
            usersData = data;
            renderUsers();
        })
        .catch(err => console.error("Error loading users:", err));
}

window.filterUsers = function() {
    renderUsers();
};

function renderUsers() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = "";
    if (usersData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No users registered.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-users").value.trim().toLowerCase();
    let hasVisibleUsers = false;

    usersData.forEach(user => {
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = (user.phone || "").toLowerCase();

        if (searchVal) {
            const matchesUsername = username.includes(searchVal);
            const matchesEmail = email.includes(searchVal);
            const matchesPhone = phone.includes(searchVal);

            if (!matchesUsername && !matchesEmail && !matchesPhone) {
                return;
            }
        }

        hasVisibleUsers = true;

        tbody.innerHTML += `
            <tr>
                <td><strong>${user.username}</strong></td>
                <td>${user.email}</td>
                <td><span class="badge-status" style="background: rgba(236,72,153,0.2); color:#ec4899; text-transform:uppercase; font-size:10px;">${user.role}</span></td>
                <td>
                    <span style="font-size:12px; color:var(--text-muted)">
                        Phone: ${user.phone || 'N/A'}<br>
                        City: ${user.city || 'N/A'}
                    </span>
                </td>
                <td>
                    <button class="btn-moderate" onclick="openUserModal(${user.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleUsers) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No matching users found.</td></tr>`;
    }
}

function openUserModal(id = null) {
    document.getElementById("user-form").reset();
    document.getElementById("user-profile-id").value = id || "";
    document.getElementById("user-modal-title").innerText = id ? "Edit User Account" : "Add User Account";

    if (id) {
        document.getElementById("pwd-note").style.display = "inline";
        fetch(`/api/admin/users/${id}/`)
            .then(res => res.json())
            .then(user => {
                document.getElementById("user-username").value = user.username;
                document.getElementById("user-email").value = user.email;
                document.getElementById("user-firstname").value = user.first_name || "";
                document.getElementById("user-lastname").value = user.last_name || "";
                document.getElementById("user-role").value = user.role || "customer";
                document.getElementById("user-phone").value = user.phone || "";
                document.getElementById("user-city").value = user.city || "";
                document.getElementById("user-address").value = user.address || "";
                document.getElementById("user-postal").value = user.postal_code || "";
            });
    } else {
        document.getElementById("pwd-note").style.display = "none";
    }

    document.getElementById("user-modal").style.display = "flex";
}

function closeUserModal() {
    document.getElementById("user-modal").style.display = "none";
}

let isSavingUser = false;
function saveUser(e) {
    e.preventDefault();
    if (isSavingUser) return;
    isSavingUser = true;

    const id = document.getElementById("user-profile-id").value;
    const submitBtn = document.querySelector("#user-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save User Account";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        username: document.getElementById("user-username").value,
        email: document.getElementById("user-email").value,
        first_name: document.getElementById("user-firstname").value,
        last_name: document.getElementById("user-lastname").value,
        role: document.getElementById("user-role").value,
        phone: document.getElementById("user-phone").value,
        city: document.getElementById("user-city").value,
        address: document.getElementById("user-address").value,
        postal_code: document.getElementById("user-postal").value
    };

    const password = document.getElementById("user-password").value;
    if (password) {
        payload.password = password;
    } else if (!id) {
        alert("Password is required for new users.");
        isSavingUser = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        return;
    }

    let endpoint = "/api/admin/users/";
    let method = "POST";
    if (id) {
        endpoint = `/api/admin/users/${id}/`;
        method = "PUT";
    }

    fetch(endpoint, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        isSavingUser = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        if (data.success || data.id) {
            closeUserModal();
            loadUsers();
        } else {
            alert(data.error || JSON.stringify(data));
        }
    })
    .catch(err => {
        isSavingUser = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        console.error("Error saving user:", err);
    });
}

function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user profile?")) return;
    fetch(`/api/admin/users/${id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadUsers();
        } else {
            alert(data.error || "Failed to delete user.");
        }
    })
    .catch(err => console.error("Error deleting user:", err));
}

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

// ==========================================
// VET CONSULT / DOCTOR APPOINTMENT MODAL
// ==========================================
function openDoctorBookingModal(id = null) {
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
}

function closeDoctorBookingModal() {
    document.getElementById("doctor-booking-modal").style.display = "none";
    document.getElementById("doctor-booking-form").reset();
}

function saveDoctorBooking(e) {
    e.preventDefault();
    const id = document.getElementById("doctor-booking-id").value;
    const submitBtn = document.querySelector("#doctor-booking-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Appointment Details";
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
            submitBtn.innerHTML = originalText;
        }
        closeDoctorBookingModal();
        loadDashboard();
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        alert(err.message);
    });
}

// ==========================================
// PET CARE BOARDING BOOKING MODAL
// ==========================================
function openCareBookingModal(id = null) {
    document.getElementById("care-booking-form").reset();
    document.getElementById("care-booking-id").value = id || "";
    
    if (id) {
        fetch(`/api/bookings/care/${id}/`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("care-booking-id").value = data.id;
                document.getElementById("care-pet-name").value = data.pet_name;
                document.getElementById("care-pet-species").value = data.pet_species;
                document.getElementById("care-pet-age").value = data.pet_age;
                document.getElementById("care-pet-gender").value = data.pet_gender;
                document.getElementById("care-notes").value = data.health_notes || "";
                
                function formatDT(val) {
                    if (!val) return "";
                    return val.substring(0, 16);
                }
                document.getElementById("care-start").value = formatDT(data.start_datetime);
                document.getElementById("care-end").value = formatDT(data.end_datetime);
                
                document.getElementById("care-vaccinated").checked = data.vaccinated;
                document.getElementById("care-special-diet").checked = data.special_diet;
                document.getElementById("care-injection").checked = data.injection_required;
                document.getElementById("care-vaccine").checked = data.vaccine_required;
                document.getElementById("care-extra").checked = data.extra_care;
                
                document.getElementById("care-status").value = data.status;
                document.getElementById("care-booking-modal").style.display = "flex";
            })
            .catch(err => console.error("Error fetching care booking:", err));
    } else {
        document.getElementById("care-status").value = "PENDING";
        document.getElementById("care-booking-modal").style.display = "flex";
    }
}

function closeCareBookingModal() {
    document.getElementById("care-booking-modal").style.display = "none";
    document.getElementById("care-booking-form").reset();
}

function saveCareBooking(e) {
    e.preventDefault();
    const id = document.getElementById("care-booking-id").value;
    const submitBtn = document.querySelector("#care-booking-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Booking Details";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        pet_name: document.getElementById("care-pet-name").value,
        pet_species: document.getElementById("care-pet-species").value,
        pet_age: document.getElementById("care-pet-age").value,
        pet_gender: document.getElementById("care-pet-gender").value,
        health_notes: document.getElementById("care-notes").value,
        start_datetime: document.getElementById("care-start").value + ":00Z",
        end_datetime: document.getElementById("care-end").value + ":00Z",
        vaccinated: document.getElementById("care-vaccinated").checked,
        special_diet: document.getElementById("care-special-diet").checked,
        injection_required: document.getElementById("care-injection").checked,
        vaccine_required: document.getElementById("care-vaccine").checked,
        extra_care: document.getElementById("care-extra").checked,
        status: document.getElementById("care-status").value
    };

    let url = id ? `/api/bookings/care/${id}/` : `/api/bookings/care/`;
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
                throw new Error(errData.error || "Failed to save care booking");
            });
        }
        return res.json();
    })
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        closeCareBookingModal();
        loadDashboard();
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        alert(err.message);
    });
}

// ==========================================
// GROOMING BOOKING MODAL
// ==========================================
function openGroomingBookingModal(id = null) {
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
                document.getElementById("groom-groomer").value = data.preferred_groomer || "";
                
                function formatDT(val) {
                    if (!val) return "";
                    return val.substring(0, 16);
                }
                document.getElementById("groom-datetime").value = formatDT(data.appointment_datetime);
                document.getElementById("groom-status").value = data.status;
                document.getElementById("grooming-booking-modal").style.display = "flex";
            })
            .catch(err => console.error("Error fetching grooming booking:", err));
    } else {
        document.getElementById("groom-status").value = "PENDING";
        document.getElementById("grooming-booking-modal").style.display = "flex";
    }
}

function closeGroomingBookingModal() {
    document.getElementById("grooming-booking-modal").style.display = "none";
    document.getElementById("grooming-booking-form").reset();
}

function saveGroomingBooking(e) {
    e.preventDefault();
    const id = document.getElementById("grooming-booking-id").value;
    const submitBtn = document.querySelector("#grooming-booking-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Session Details";
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
        preferred_groomer: document.getElementById("groom-groomer").value,
        appointment_datetime: document.getElementById("groom-datetime").value + ":00Z",
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
}

// ==========================================
// CART ITEM CRUD OPERATIONS
// ==========================================
let cartitemsData = [];
function loadCartItems() {
    fetch("/api/admin/cart-items/")
        .then(res => res.json())
        .then(data => {
            cartitemsData = data;
            renderCartItems();
        })
        .catch(err => console.error("Error loading cart items:", err));
}

window.filterCartItems = function() {
    renderCartItems();
};

function renderCartItems() {
    const tbody = document.getElementById("cartitems-tbody");
    tbody.innerHTML = "";
    if (cartitemsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No items in user carts.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-cartitems").value.trim().toLowerCase();
    let hasVisibleCartItems = false;

    cartitemsData.forEach(item => {
        const username = (item.username || "").toLowerCase();
        const itemType = (item.item_type || "").toLowerCase();
        const itemId = String(item.item_id).toLowerCase();
        const name = (item.name || "").toLowerCase();

        if (searchVal) {
            const matchesUsername = username.includes(searchVal);
            const matchesType = itemType.includes(searchVal);
            const matchesId = itemId.includes(searchVal);
            const matchesName = name.includes(searchVal);

            if (!matchesUsername && !matchesType && !matchesId && !matchesName) {
                return;
            }
        }

        hasVisibleCartItems = true;

        tbody.innerHTML += `
            <tr>
                <td><strong>${item.username}</strong> (ID: ${item.user})</td>
                <td>${item.item_type}</td>
                <td>${item.item_id}</td>
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="btn-moderate" onclick="openCartItemModal(${item.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteCartItem(${item.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleCartItems) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No matching cart items found.</td></tr>`;
    }
}

function openCartItemModal(id = null) {
    document.getElementById("cartitem-form").reset();
    document.getElementById("cartitem-id").value = id || "";
    document.getElementById("cartitem-modal-title").innerText = id ? "Edit Cart Item" : "Add Cart Item";

    if (id) {
        fetch(`/api/admin/cart-items/${id}/`)
            .then(res => res.json())
            .then(item => {
                document.getElementById("cartitem-user").value = item.user;
                document.getElementById("cartitem-type").value = item.item_type;
                document.getElementById("cartitem-itemid").value = item.item_id;
                document.getElementById("cartitem-name").value = item.name;
                document.getElementById("cartitem-price").value = item.price;
                document.getElementById("cartitem-qty").value = item.quantity;
            });
    }

    document.getElementById("cartitem-modal").style.display = "flex";
}

function closeCartItemModal() {
    document.getElementById("cartitem-modal").style.display = "none";
}

let isSavingCartItem = false;
function saveCartItem(e) {
    e.preventDefault();
    if (isSavingCartItem) return;
    isSavingCartItem = true;

    const id = document.getElementById("cartitem-id").value;
    const submitBtn = document.querySelector("#cartitem-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Cart Item";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        user: parseInt(document.getElementById("cartitem-user").value),
        item_type: document.getElementById("cartitem-type").value,
        item_id: parseInt(document.getElementById("cartitem-itemid").value),
        name: document.getElementById("cartitem-name").value,
        price: parseFloat(document.getElementById("cartitem-price").value),
        quantity: parseInt(document.getElementById("cartitem-qty").value)
    };

    let endpoint = "/api/admin/cart-items/";
    let method = "POST";
    if (id) {
        endpoint = `/api/admin/cart-items/${id}/`;
        method = "PUT";
    }

    fetch(endpoint, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        isSavingCartItem = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        if (data.id || data.success) {
            closeCartItemModal();
            loadCartItems();
        } else {
            alert(JSON.stringify(data));
        }
    })
    .catch(err => {
        isSavingCartItem = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        console.error("Error saving cart item:", err);
    });
}

function deleteCartItem(id) {
    if (!confirm("Are you sure you want to delete this cart item?")) return;
    fetch(`/api/admin/cart-items/${id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadCartItems();
        } else {
            alert("Failed to delete cart item.");
        }
    })
    .catch(err => console.error("Error deleting cart item:", err));
}

// ==========================================
// PET HEALTH PROFILE CRUD OPERATIONS
// ==========================================
let healthprofilesData = [];
function loadHealthProfiles() {
    fetch("/api/admin/health-profiles/")
        .then(res => res.json())
        .then(data => {
            healthprofilesData = data;
            renderHealthProfiles();
        })
        .catch(err => console.error("Error loading health profiles:", err));
}

window.filterHealthProfiles = function() {
    renderHealthProfiles();
};

function renderHealthProfiles() {
    const tbody = document.getElementById("healthprofiles-tbody");
    tbody.innerHTML = "";
    if (healthprofilesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted)">No health profiles created.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-healthprofiles").value.trim().toLowerCase();
    let hasVisibleProfiles = false;

    healthprofilesData.forEach(profile => {
        const petName = (profile.pet_name || "").toLowerCase();
        const microchip = (profile.microchip_id || "").toLowerCase();

        if (searchVal) {
            const matchesPet = petName.includes(searchVal);
            const matchesMicrochip = microchip.includes(searchVal);

            if (!matchesPet && !matchesMicrochip) {
                return;
            }
        }

        hasVisibleProfiles = true;
        const microchipDisplay = profile.microchip_id ? profile.microchip_id : "-";

        tbody.innerHTML += `
            <tr>
                <td><strong>${profile.pet_name || 'N/A'}</strong> (Pet ID: ${profile.pet})</td>
                <td><code style="font-family: monospace; font-size:13px; color: var(--secondary);">${microchipDisplay}</code></td>
                <td>${profile.birth_date || 'N/A'}</td>
                <td>${profile.gender || 'N/A'}</td>
                <td>${profile.weight_kg || 'N/A'} kg</td>
                <td>${profile.vaccinated ? 'Yes':'No'}</td>
                <td>${profile.adoption_ready ? 'Yes':'No'}</td>
                <td>
                    <button class="btn-moderate" onclick="openHealthProfileModal(${profile.id})">Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteHealthProfile(${profile.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleProfiles) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted)">No matching health profiles found.</td></tr>`;
    }
}

function openHealthProfileModal(id = null) {
    document.getElementById("healthprofile-form").reset();
    document.getElementById("healthprofile-id").value = id || "";
    document.getElementById("health-pet").disabled = false;
    document.getElementById("healthprofile-modal-title").innerText = id ? "Edit Health Profile" : "Add Health Profile";

    if (id) {
        document.getElementById("health-pet").disabled = true;
        fetch(`/api/admin/health-profiles/${id}/`)
            .then(res => res.json())
            .then(profile => {
                document.getElementById("health-pet").value = profile.pet;
                document.getElementById("health-birth").value = profile.birth_date || "";
                document.getElementById("health-gender").value = profile.gender || "";
                document.getElementById("health-weight").value = profile.weight_kg || "";
                document.getElementById("health-vaccinated").checked = profile.vaccinated || false;
                document.getElementById("health-dewormed").checked = profile.dewormed || false;
                document.getElementById("health-neutered").checked = profile.neutered_spayed || false;
                document.getElementById("health-adoption").checked = profile.adoption_ready || false;
                document.getElementById("health-lastvac").value = profile.last_vaccination_date || "";
                document.getElementById("health-microchip").value = profile.microchip_id || "";
                document.getElementById("health-vetname").value = profile.vet_name || "";
                document.getElementById("health-vetcontact").value = profile.vet_contact || "";
                document.getElementById("health-diet").value = profile.diet_type || "";
                document.getElementById("health-activity").value = profile.activity_level || "";
                document.getElementById("health-temperament").value = profile.temperament || "";
                document.getElementById("health-conditions").value = profile.medical_conditions || "";
                document.getElementById("health-allergies").value = profile.allergies || "";
            });
    }

    document.getElementById("healthprofile-modal").style.display = "flex";
}

function closeHealthProfileModal() {
    document.getElementById("healthprofile-modal").style.display = "none";
}

let isSavingHealthProfile = false;
function saveHealthProfile(e) {
    e.preventDefault();
    if (isSavingHealthProfile) return;
    isSavingHealthProfile = true;

    const id = document.getElementById("healthprofile-id").value;
    const submitBtn = document.querySelector("#healthprofile-form button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Save Health Profile";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
        pet: parseInt(document.getElementById("health-pet").value),
        birth_date: document.getElementById("health-birth").value || null,
        gender: document.getElementById("health-gender").value || "",
        weight_kg: document.getElementById("health-weight").value ? parseFloat(document.getElementById("health-weight").value) : null,
        vaccinated: document.getElementById("health-vaccinated").checked,
        dewormed: document.getElementById("health-dewormed").checked,
        neutered_spayed: document.getElementById("health-neutered").checked,
        adoption_ready: document.getElementById("health-adoption").checked,
        last_vaccination_date: document.getElementById("health-lastvac").value || null,
        microchip_id: document.getElementById("health-microchip").value || "",
        vet_name: document.getElementById("health-vetname").value || "",
        vet_contact: document.getElementById("health-vetcontact").value || "",
        diet_type: document.getElementById("health-diet").value || "",
        activity_level: document.getElementById("health-activity").value || "",
        temperament: document.getElementById("health-temperament").value || "",
        medical_conditions: document.getElementById("health-conditions").value || "",
        allergies: document.getElementById("health-allergies").value || ""
    };

    let endpoint = "/api/admin/health-profiles/";
    let method = "POST";
    if (id) {
        endpoint = `/api/admin/health-profiles/${id}/`;
        method = "PUT";
    }

    fetch(endpoint, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        isSavingHealthProfile = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        if (data.id || data.success) {
            closeHealthProfileModal();
            loadHealthProfiles();
        } else {
            alert(JSON.stringify(data));
        }
    })
    .catch(err => {
        isSavingHealthProfile = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        console.error("Error saving health profile:", err);
    });
}

function deleteHealthProfile(id) {
    if (!confirm("Are you sure you want to delete this pet health profile?")) return;
    fetch(`/api/admin/health-profiles/${id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadHealthProfiles();
        } else {
            alert("Failed to delete health profile.");
        }
    })
    .catch(err => console.error("Error deleting health profile:", err));
}

window.filterBookings = function() {
    renderBookings();
};

function renderBookings() {
    if (!dashboardData) return;
    const searchVal = document.getElementById("search-bookings").value.trim().toLowerCase();

    // 1. Doctor Appointments
    const docTbody = document.getElementById("doctor-tbody");
    if (docTbody) {
        docTbody.innerHTML = "";
        let visibleAppointments = dashboardData.appointments.filter(a => {
            if (!searchVal) return true;
            const username = (a.username || "").toLowerCase();
            const petName = (a.pet_name || "").toLowerCase();
            return username.includes(searchVal) || petName.includes(searchVal);
        });

        if (visibleAppointments.length === 0) {
            docTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No matching appointments.</td></tr>`;
        } else {
            visibleAppointments.forEach(a => {
                docTbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${a.pet_name}</strong> (${a.pet_type})<br>
                            <span style="font-size:12px; color:var(--text-muted)">Client: ${a.username}</span>
                        </td>
                        <td>${a.appointment_date} @ ${a.appointment_time}</td>
                        <td>${a.symptoms}</td>
                        <td><span style="text-transform: uppercase; font-weight:600;">${a.status}</span></td>
                        <td>
                            <button onclick="openDoctorBookingModal(${a.id})" class="btn-moderate" style="padding: 5px 10px; font-size:12px;"><i class="fa-solid fa-edit"></i> Edit</button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 2. Pet Care Boarding Bookings
    const careTbody = document.getElementById("care-tbody");
    if (careTbody) {
        careTbody.innerHTML = "";
        let visibleCare = dashboardData.pet_care.filter(c => {
            if (!searchVal) return true;
            const petName = (c.pet_name || "").toLowerCase();
            const userId = String(c.user).toLowerCase();
            return petName.includes(searchVal) || userId.includes(searchVal);
        });

        if (visibleCare.length === 0) {
            careTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No matching care bookings.</td></tr>`;
        } else {
            visibleCare.forEach(c => {
                let opts = [];
                if (c.vaccinated) opts.push("Vaccinated");
                if (c.special_diet) opts.push("Diet");
                if (c.injection_required) opts.push("Injection");
                if (c.vaccine_required) opts.push("Vaccine");
                if (c.extra_care) opts.push("Extra Care");
                let optsStr = opts.join(", ") || "None";

                careTbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${c.pet_name}</strong> (${c.pet_species})<br>
                            <span style="font-size:12px; color:var(--text-muted)">Client ID: ${c.user}</span>
                        </td>
                        <td>
                            ${new Date(c.start_datetime).toLocaleDateString()} to ${new Date(c.end_datetime).toLocaleDateString()}<br>
                            <span style="font-size:11px; color:var(--text-muted)">${c.total_days} days</span>
                        </td>
                        <td>${optsStr}</td>
                        <td>₹${c.total_price}</td>
                        <td><span style="text-transform: uppercase; font-weight:600;">${c.status}</span></td>
                        <td>
                            <button onclick="openCareBookingModal(${c.id})" class="btn-moderate" style="padding: 5px 10px; font-size:12px;"><i class="fa-solid fa-edit"></i> Edit</button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 3. Grooming Sessions
    const groomTbody = document.getElementById("grooming-tbody");
    if (groomTbody) {
        groomTbody.innerHTML = "";
        let visibleGrooming = dashboardData.grooming.filter(g => {
            if (!searchVal) return true;
            const petName = (g.pet_name || "").toLowerCase();
            const userId = String(g.user).toLowerCase();
            return petName.includes(searchVal) || userId.includes(searchVal);
        });

        if (visibleGrooming.length === 0) {
            groomTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted)">No matching grooming sessions.</td></tr>`;
        } else {
            visibleGrooming.forEach(g => {
                groomTbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${g.pet_name}</strong> (${g.pet_type})<br>
                            <span style="font-size:12px; color:var(--text-muted)">Client ID: ${g.user}</span>
                        </td>
                        <td>
                            ${g.package_type}<br>
                            <span style="font-size:11px; color:var(--text-muted)">${g.visit_type}</span>
                        </td>
                        <td>${new Date(g.appointment_datetime).toLocaleString()}</td>
                        <td>${g.preferred_groomer || "Any Groomer"}</td>
                        <td>₹${g.total_price}</td>
                        <td><span style="text-transform: uppercase; font-weight:600;">${g.status}</span></td>
                        <td>
                            <button onclick="openGroomingBookingModal(${g.id})" class="btn-moderate" style="padding: 5px 10px; font-size:12px;"><i class="fa-solid fa-edit"></i> Edit</button>
                        </td>
                    </tr>
                `;
            });
        }
    }
}
