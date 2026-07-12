// Mobile Sidebar Toggle Logic
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// Dynamic API Fetch Logic for AI Dashboard
document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/admin/ai-insights/")
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("stat-total-orders").innerText = data.total_orders;
            document.getElementById("stat-total-revenue").innerText = "₹" + data.total_revenue;
            document.getElementById("stat-total-refunds").innerText = data.total_refunds;
            document.getElementById("stat-cancelled-orders").innerText = data.cancelled_orders;
            document.getElementById("stat-growth-rate").innerText = data.growth_rate + "%";

            // AI Insights
            document.getElementById("ai-insights-content").innerHTML = data.ai_insights;

            // Top Items
            const topTbody = document.getElementById("top-items-tbody");
            topTbody.innerHTML = "";
            if (!data.top_items || data.top_items.length === 0) {
                topTbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">No sales data available.</td></tr>`;
            } else {
                data.top_items.forEach(item => {
                    topTbody.innerHTML += `
                        <tr>
                            <td>${item.product_name}</td>
                            <td style="text-align: right;" class="bold-val">${item.total_qty} units</td>
                        </tr>
                    `;
                });
            }

            // Low Stock
            const lowTbody = document.getElementById("low-stock-tbody");
            lowTbody.innerHTML = "";
            if (!data.low_stock || data.low_stock.length === 0) {
                lowTbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">All items are well stocked!</td></tr>`;
            } else {
                data.low_stock.forEach(item => {
                    lowTbody.innerHTML += `
                        <tr>
                            <td>${item}</td>
                            <td style="text-align: right;"><span class="badge-danger">Low stock</span></td>
                        </tr>
                    `;
                });
            }

            // Peak Hours
            const peakTbody = document.getElementById("peak-hours-tbody");
            peakTbody.innerHTML = "";
            if (!data.peak_hours || data.peak_hours.length === 0) {
                peakTbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">No appointments booked.</td></tr>`;
            } else {
                data.peak_hours.forEach(hour => {
                    peakTbody.innerHTML += `
                        <tr>
                            <td>${hour}</td>
                            <td style="text-align: right;" class="bold-val">Active Slots</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(error => {
            console.error("AI Insights Fetch Error:", error);
            document.getElementById("ai-insights-content").innerText = "Error loading cached weekly report. Make sure the management task has run.";
        });
});
