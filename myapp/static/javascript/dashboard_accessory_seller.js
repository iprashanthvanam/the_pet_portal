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
    fetch("/api/dashboard/accessory-seller/")
        .then(res => res.json())
        .then(data => {
            dashboardData = data;
            document.getElementById("stat-listings").innerText = data.listings.length;
            document.getElementById("stat-orders").innerText = data.orders.length;
            
            renderDashboardLogs();
            renderAccessories();
            renderOrders();
            renderReviews();
        })
        .catch(err => console.error("Error loading dashboard data:", err));
}

// ==========================================
// 1. DASHBOARD LOGS SECTION
// ==========================================
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
                <td><span class="badge-status" style="background: rgba(99,102,241,0.2); color:#6366f1; padding:4px 10px; border-radius:20px; font-weight:600; font-size:11px;">${o.status}</span></td>
            </tr>
        `;
    });

    if (!hasVisibleLogs) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted)">No matching logs found.</td></tr>`;
    }
}

// ==========================================
// 2. MANAGE ACCESSORIES SECTION
// ==========================================
window.filterAccessories = function() {
    renderAccessories();
};

function renderAccessories() {
    if (!dashboardData) return;
    const tbody = document.getElementById("accessories-tbody");
    tbody.innerHTML = "";

    const searchVal = document.getElementById("search-accessories").value.trim().toLowerCase();
    let hasVisibleAccessories = false;

    dashboardData.listings.forEach(acc => {
        const name = (acc.name || "").toLowerCase();
        const category = (acc.category || "").toLowerCase();

        if (searchVal && !name.includes(searchVal) && !category.includes(searchVal)) {
            return;
        }

        hasVisibleAccessories = true;
        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${acc.image || 'https://via.placeholder.com/50'}" alt="${acc.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
                        <strong>${acc.name}</strong>
                    </div>
                </td>
                <td>${acc.category}</td>
                <td>₹${acc.price}</td>
                <td>
                    <button class="btn-moderate" onclick="openModal(${acc.id})" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;"><i class="fa-solid fa-edit"></i> Edit</button>
                    <button class="btn-moderate btn-danger" onclick="deleteAccessory(${acc.id})" style="padding: 4px 8px; font-size: 12px;"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            </tr>
        `;
    });

    if (!hasVisibleAccessories) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted)">No accessories found.</td></tr>`;
    }
}

window.openModal = function(id = null) {
    document.getElementById("modal-form").reset();
    document.getElementById("item-id").value = id || "";
    document.getElementById("modal-title").innerText = id ? "Edit Accessory" : "Add Accessory";

    if (id) {
        fetch(`/api/admin/accessories/${id}/`)
            .then(res => res.json())
            .then(item => {
                document.getElementById("form-name").value = item.name;
                document.getElementById("form-category").value = item.category;
                document.getElementById("form-price").value = item.price;
                document.getElementById("form-description").value = item.description || "";
                document.getElementById("form-brand").value = item.brand || "";
                document.getElementById("form-size").value = item.size || "";
                document.getElementById("form-color").value = item.color || "";
                document.getElementById("form-pet-type").value = item.pet_type || "";
            });
    }
    document.getElementById("item-modal").style.display = "flex";
};

window.closeModal = function() {
    document.getElementById("item-modal").style.display = "none";
};

window.saveItem = function(e) {
    e.preventDefault();
    const id = document.getElementById("item-id").value;

    let formData = new FormData();
    formData.append("name", document.getElementById("form-name").value);
    formData.append("category", document.getElementById("form-category").value);
    formData.append("price", document.getElementById("form-price").value);
    formData.append("description", document.getElementById("form-description").value);
    formData.append("brand", document.getElementById("form-brand").value);
    formData.append("size", document.getElementById("form-size").value);
    formData.append("color", document.getElementById("form-color").value);
    formData.append("pet_type", document.getElementById("form-pet-type").value);

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

    let endpoint = "/api/admin/accessories/";
    let method = "POST";
    if (id) {
        endpoint = `/api/admin/accessories/${id}/`;
        method = "PUT";
    }

    fetch(endpoint, {
        method: method,
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.id || data.success) {
            closeModal();
            loadDashboard();
        } else {
            alert(JSON.stringify(data));
        }
    })
    .catch(err => console.error("Error saving accessory:", err));
};

window.deleteAccessory = function(id) {
    if (!confirm("Are you sure you want to delete this accessory listing?")) return;
    fetch(`/api/admin/accessories/${id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })
    .then(res => res.json())
    .then(data => {
        loadDashboard();
    })
    .catch(err => console.error("Error deleting accessory:", err));
};

// ==========================================
// 3. ORDER OPERATIONS SECTION
// ==========================================
window.filterOrders = function() {
    renderOrders();
};

function renderOrders() {
    if (!dashboardData) return;
    const tbody = document.getElementById("orders-tbody");
    tbody.innerHTML = "";

    if (dashboardData.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No orders placed.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById("search-orders").value.trim().toLowerCase();
    let hasVisibleOrders = false;

    dashboardData.orders.forEach(order => {
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
            <select class="filter-select" onchange="updateOrderStatus('${order.order_id}', this.value)" style="padding: 5px 10px; font-size:12px;">
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

window.openOrderModal = function(orderId) {
    fetch(`/api/orders/${orderId}/`)
        .then(res => res.json())
        .then(order => {
            document.getElementById("order-edit-id").value = order.order_id;
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
};

window.closeOrderModal = function() {
    document.getElementById("order-modal").style.display = "none";
    document.getElementById("order-modal-form").reset();
};

window.saveOrderDetails = function(e) {
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
};

window.updateOrderStatus = function(orderId, status) {
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
        loadDashboard();
    })
    .catch(err => console.error("Error updating order status:", err));
};

// ==========================================
// 4. REVIEW MODERATION SECTION
// ==========================================
window.renderReviews = function() {
    if (!dashboardData) return;
    const ratingFilter = document.getElementById("filter-rating").value;
    const reportedFilter = document.getElementById("filter-reported").value;
    const tbody = document.getElementById("reviews-tbody");
    tbody.innerHTML = "";

    let filtered = dashboardData.reviews;
    if (ratingFilter) {
        filtered = filtered.filter(r => r.rating == ratingFilter);
    }
    if (reportedFilter) {
        filtered = filtered.filter(r => r.is_reported === (reportedFilter === 'true'));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">No reviews matching filters.</td></tr>`;
        return;
    }

    filtered.forEach(review => {
        let actionButtons = "";
        if (review.is_reported) {
            actionButtons += `
                <button class="btn-moderate" onclick="moderateReview(${review.id}, 'approve')" style="padding:4px 8px; font-size:12px; margin-right:5px;">Clear Flag</button>
            `;
        }
        actionButtons += `
            <button class="btn-moderate btn-danger" onclick="deleteReview(${review.id})" style="padding:4px 8px; font-size:12px;">Delete</button>
        `;

        let reviewImageHTML = "";
        const rMedia = [];
        if (review.image) rMedia.push({ type: 'image', url: review.image });
        if (review.video) rMedia.push({ type: 'video', url: review.video });

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

                reviewImageHTML = `
                    <div style="margin-top: 8px; position: relative; overflow: hidden; width: 160px; height: 120px; border-radius: 6px; border: 1px solid var(--border-color);">
                        <div id="${carouselId}" style="display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                            ${slides}
                        </div>
                        <div style="position: absolute; bottom: 5px; width: 100%; text-align: center; z-index: 10;">
                            <span class="carousel-dot active" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(0%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===0?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: var(--primary); border-radius: 50%; display: inline-block; cursor: pointer;"></span>
                            <span class="carousel-dot" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(-100%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===1?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: #bbb; border-radius: 50%; display: inline-block; cursor: pointer;"></span>
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
                
                repliesHTML += `
                    <div style="margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 13px; max-width: 100%;">
                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 3px; color: var(--text-main);">
                            <span>${reply.username}</span>
                            ${badge}
                        </div>
                        <p style="color: var(--text-muted); margin: 0; line-height: 1.4; word-break: break-word; white-space: pre-wrap;">${reply.reply_text}</p>
                    </div>
                `;
            });
        }

        let replyFormHTML = `
            <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-top: 10px; display: flex; gap: 8px; width: 100%;">
                <input type="text" placeholder="Write reply as Accessory Seller..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 6px 10px; border-radius: 6px; font-size: 12px;">
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
                    ${reviewImageHTML}
                    <div class="replies-list" style="margin-top: 10px; max-width: 100%;">
                        ${repliesHTML}
                    </div>
                    ${replyFormHTML}
                </td>
                <td>
                    <strong style="color: ${review.is_reported ? '#ef4444' : '#10b981'}">
                        ${review.is_reported ? 'FLAGGED / REPORTED' : 'CLEAN'}
                    </strong>
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

window.moderateReview = function(reviewId, action) {
    fetch(`/api/reviews/${reviewId}/moderate/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ action: action })
    })
    .then(res => res.json())
    .then(data => {
        loadDashboard();
    })
    .catch(err => console.error("Error moderating review:", err));
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
