// Mobile menu toggle logic
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

document.addEventListener("DOMContentLoaded", function () {
    const trackOrderForm = document.getElementById("trackOrderForm");
    const orderIdInput = document.getElementById("orderIdInput");
    const resultContainer = document.getElementById("trackingResultContainer");

    if (trackOrderForm) {
        trackOrderForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const orderId = orderIdInput.value.trim();
            if (!orderId) return;

            resultContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 20px;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <p>Fetching tracking details...</p>
                </div>
            `;

            fetch(`/api/orders/${orderId}/`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error("No order found with that ID or access denied.");
                    }
                    return res.json();
                })
                .then(order => {
                    if (order.status === "CANCELLED") {
                        resultContainer.innerHTML = `
                            <div class="cancelled-banner">
                                <i class="fa-solid fa-circle-exclamation"></i>
                                <div>
                                    <strong>Order Cancelled</strong><br>
                                    This order was cancelled. If you made a payment, please check your order history for refund details.
                                </div>
                            </div>
                        `;
                        return;
                    }

                    // Build timeline steps mapping
                    const steps = [
                        { label: 'Order Confirmed', desc: 'Your order has been placed and confirmed successfully.', time: order.confirmed_at },
                        { label: 'Processing', desc: 'Your order is being prepared and packed.', time: order.processing_at },
                        { label: 'Shipped', desc: 'Your package is on its way to the delivery hub.', time: order.shipped_at },
                        { label: 'Delivered', desc: 'Your order has been delivered. Enjoy!', time: order.delivered_at }
                    ];

                    const statusOrder = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                    const currentIndex = statusOrder.indexOf(order.status);

                    let timelineHtml = '<div class="status-timeline">';

                    steps.forEach((step, i) => {
                        let isCompleted = false;
                        let isActive = false;

                        if (i < currentIndex) {
                            isCompleted = true;
                        } else if (i === currentIndex) {
                            isCompleted = true;
                            isActive = true;
                        }

                        const completedClass = isCompleted ? 'completed' : '';
                        const activeClass = isActive ? 'active' : '';
                        const markerContent = isCompleted ? '<i class="fa-solid fa-check"></i>' : '';

                        let timeHtml = '';
                        if (step.time) {
                            const dateObj = new Date(step.time);
                            const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
                            const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
                            timeHtml = `
                                <div class="step-time">
                                    <i class="fa-regular fa-calendar"></i>
                                    ${dateObj.toLocaleDateString('en-US', optionsDate)}
                                    &nbsp;
                                    <i class="fa-regular fa-clock"></i>
                                    ${dateObj.toLocaleTimeString('en-US', optionsTime)}
                                </div>
                            `;
                        }

                        timelineHtml += `
                            <div class="timeline-step ${completedClass} ${activeClass}">
                                <div class="step-marker">${markerContent}</div>
                                <div class="step-content">
                                    <h3 class="step-title">${step.label}</h3>
                                    <p class="step-desc">${step.desc}</p>
                                    ${timeHtml}
                                </div>
                            </div>
                        `;
                    });

                    timelineHtml += '</div>';
                    resultContainer.innerHTML = timelineHtml;
                })
                .catch(err => {
                    console.error("Tracking error:", err);
                    resultContainer.innerHTML = `
                        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <i class="fa-solid fa-circle-xmark" style="margin-right: 8px;"></i>
                            No order found with that ID or permission denied. Please verify the ID and try again.
                        </div>
                    `;
                });
        });
    }
});