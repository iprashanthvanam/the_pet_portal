// --- Mobile Sidebar Toggle Logic ---
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        loadOrders();

        function loadOrders() {
            const container = document.getElementById("orders-container");
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted)">Loading your order history...</p>`;

            fetch("/api/orders/")
                .then(res => res.json())
                .then(data => {
                    container.innerHTML = "";
                    if (data.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
                                <h2>No orders found</h2>
                                <p>You haven't placed any orders yet. Check out our store to find your new best friend!</p>
                                <a href="/pets/" class="btn-sm btn-primary" style="display:inline-block; padding: 12px 25px; font-size: 14px; margin-top: 20px;">Start Shopping</a>
                            </div>
                        `;
                        return;
                    }

                    data.forEach(order => {
                        // Render Items
                        let itemsHtml = "";
                        order.items.forEach(item => {
                            itemsHtml += `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>₹${item.price}</td>
                                    <td>${item.quantity}</td>
                                    <td class="total-val" style="text-align: right;">₹${item.price * item.quantity}</td>
                                </tr>
                            `;
                        });

                        // Payment Status Badges
                        let paymentBadge = "";
                        if (order.status === "CANCELLED") {
                            paymentBadge = `<span class="badge-cancelled"><i class="fa-solid fa-xmark"></i> Order Cancelled</span>`;
                        } else if (order.payment_status === "PAID") {
                            paymentBadge = `<span class="badge-paid"><i class="fa-solid fa-check"></i> Successfully Paid (${order.payment_method})</span>`;
                        } else if (order.payment_status === "REFUNDED") {
                            paymentBadge = `<span class="badge-cancelled"><i class="fa-solid fa-rotate-left"></i> Amount Refunded</span>`;
                        } else {
                            paymentBadge = `<span class="badge-unpaid"><i class="fa-solid fa-triangle-exclamation"></i> Payment Pending (${order.payment_method})</span>`;
                        }

                        // Refund details
                        let refundDetailsHtml = "";
                        if (order.payment_status === "REFUNDED" && order.refund_rrn) {
                            refundDetailsHtml = `
                                <div class="refund-info">
                                    <strong>Refund Reference (RRN):</strong> ${order.refund_rrn}
                                </div>
                            `;
                        }

                        // Buttons
                        let actionButtonsHtml = "";
                        if (order.payment_status === "UNPAID" && ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)) {
                            actionButtonsHtml += `
                                <button onclick="retryPayment(event, '${order.order_id}')" class="btn-sm btn-primary">Pay ₹${order.total_cost} Now</button>
                            `;
                        }
                        if (order.payment_status === "PAID" || order.status === "DELIVERED") {
                            actionButtonsHtml += `
                                <a href="/order/${order.order_id}/invoice/download/" class="btn-sm btn-outline"><i class="fa-solid fa-download"></i> Download Invoice</a>
                            `;
                        }
                        if (["CONFIRMED", "PENDING"].includes(order.status)) {
                            actionButtonsHtml += `
                                <button onclick="cancelOrder('${order.order_id}')" class="btn-sm btn-danger"><i class="fa-solid fa-ban"></i> Cancel Order</button>
                            `;
                        }

                        container.innerHTML += `
                            <div class="order-card">
                                <div class="order-header" onclick="toggleOrder(this)">
                                    <div class="header-content-grid">
                                        <div class="header-item">
                                            <span class="label">Order ID</span>
                                            <span class="value">#${order.order_id.substring(0, 10)}</span>
                                        </div>
                                        <div class="header-item">
                                            <span class="label">Date</span>
                                            <span class="value">${new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div class="header-item">
                                            <span class="label">Total</span>
                                            <span class="value">₹${order.total_cost}</span>
                                        </div>
                                        <div class="header-item">
                                            <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                                        </div>
                                    </div>
                                    <div class="toggle-icon">
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </div>
                                </div>

                                <div class="order-details">
                                    <div class="details-wrapper">
                                        <div class="full-id-row">
                                            <span><strong>Full Order ID:</strong> <span style="font-family: monospace; color: var(--primary);">${order.order_id}</span></span>
                                            <span><strong>Time:</strong> ${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>

                                        <div class="details-grid">
                                            <div class="order-section">
                                                <h4><i class="fa-regular fa-user" style="margin-right: 5px;"></i> Customer Details</h4>
                                                <p><strong>Name:</strong> ${order.full_name}</p>
                                                <p><strong>Email:</strong> ${order.email}</p>
                                                <p><strong>Mobile:</strong> ${order.mobile_number}</p>
                                            </div>

                                            <div class="order-section">
                                                <h4><i class="fa-regular fa-map" style="margin-right: 5px;"></i> Shipping Address</h4>
                                                <p>${order.address}</p>
                                                <p>${order.city} - ${order.postal_code}</p>
                                            </div>
                                        </div>

                                        <div class="order-section payment-section">
                                            <h4><i class="fa-regular fa-credit-card" style="margin-right: 5px;"></i> Payment & Actions</h4>
                                            <div class="payment-row">
                                                <div class="payment-status-badge">
                                                    ${paymentBadge}
                                                </div>
                                                ${refundDetailsHtml}
                                                <div class="action-buttons">
                                                    ${actionButtonsHtml}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="order-section">
                                            <h4><i class="fa-solid fa-box" style="margin-right: 5px;"></i> Order Items</h4>
                                            <div style="overflow-x: auto;">
                                                <table class="items-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Price</th>
                                                            <th>Qty</th>
                                                            <th style="text-align: right;">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${itemsHtml}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        `;
                    });
                })
                .catch(err => console.error("Error loading order list:", err));
        }

        window.cancelOrder = function (orderId) {
            if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
            fetch(`/api/orders/${orderId}/cancel/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                loadOrders();
            })
            .catch(err => console.error("Cancel order error:", err));
        };

        window.retryPayment = function (e, orderId) {
            // Find the clicked button and show loading state
            const btn = e.target.closest('button');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            fetch(`/api/orders/${orderId}/retry-payment/`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                } else if (data.razorpay) {
                    // Restore button before opening modal
                    btn.disabled = false;
                    btn.innerHTML = originalText;

                    const options = {
                        "key": data.razorpay.key,
                        "amount": data.razorpay.amount,
                        "currency": data.razorpay.currency,
                        "name": "The Pet Portal",
                        "description": "Retry Order Payment",
                        "order_id": data.razorpay.order_id,
                        "handler": function (response){
                            // Show verifying state
                            btn.disabled = true;
                            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

                            fetch("/api/payment/verify/", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": getCookie("csrftoken")
                                },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            })
                            .then(verifyRes => verifyRes.json())
                            .then(verifyData => {
                                if (verifyData.error) {
                                    alert(verifyData.error);
                                    btn.disabled = false;
                                    btn.innerHTML = originalText;
                                } else {
                                    // Redirect to success page
                                    window.location.href = `/order/success/${verifyData.order_id}/`;
                                }
                            })
                            .catch(err => {
                                btn.disabled = false;
                                btn.innerHTML = originalText;
                                console.error("Verify payment error:", err);
                            });
                        },
                        "modal": {
                            "ondismiss": function() {
                                btn.disabled = false;
                                btn.innerHTML = originalText;
                            }
                        },
                        "theme": {
                            "color": "#6366f1"
                        }
                    };
                    const rzp = new Razorpay(options);
                    rzp.open();
                }
            })
            .catch(err => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                console.error("Retry payment error:", err);
            });
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

        window.toggleOrder = function (headerElement) {
            const clickedCard = headerElement.parentElement;
            const allCards = document.querySelectorAll('.order-card');
            const isActive = clickedCard.classList.contains('active');
            allCards.forEach(card => card.classList.remove('active'));
            if (!isActive) {
                clickedCard.classList.add('active');
            }
        };
    });