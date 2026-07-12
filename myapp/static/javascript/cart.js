// --- Mobile Sidebar Toggle Logic ---
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function() {
        loadCart();

        function loadCart() {
            fetch("/api/cart/")
                .then(res => res.json())
                .then(data => {
                    const contentDiv = document.getElementById("cart-content");
                    const emptyDiv = document.getElementById("cart-empty");
                    const tbody = document.getElementById("cart-tbody");
                    const totalEl = document.getElementById("cart-total-price");

                    if (data.items.length === 0) {
                        contentDiv.style.display = "none";
                        emptyDiv.style.display = "block";
                        updateBadge(0);
                        return;
                    }

                    contentDiv.style.display = "block";
                    emptyDiv.style.display = "none";
                    tbody.innerHTML = "";

                    data.items.forEach(item => {
                        // For pets, disable the + button (max qty 1)
                        const isPet = item.type === 'pet';
                        const plusDisabled = (isPet && item.quantity >= 1) ? 'disabled' : '';
                        const plusBtnClass = (isPet && item.quantity >= 1) ? 'qty-btn qty-btn-disabled' : 'qty-btn';

                        tbody.innerHTML += `
                            <tr id="row-${item.id}-${item.type}">
                                <td class="product-cell" data-label="Product">
                                    <div class="product-info">
                                        <span class="product-name">${item.name}</span>
                                    </div>
                                </td>
                                <td data-label="Category">
                                    <span class="badge-type badge-${item.type}">
                                        ${item.type.toUpperCase()}
                                    </span>
                                </td>
                                <td class="price-text" data-label="Price">
                                    ₹${item.price}
                                </td>
                                <td data-label="Quantity">
                                    <div class="qty-control">
                                        <button class="qty-btn" onclick="updateQty(${item.id}, '${item.type}', ${item.quantity - 1})">−</button>
                                        <span class="qty-val">${item.quantity}</span>
                                        <button class="${plusBtnClass}" ${plusDisabled} onclick="updateQty(${item.id}, '${item.type}', ${item.quantity + 1})">+</button>
                                    </div>
                                </td>
                                <td class="subtotal-text" data-label="Subtotal">
                                    ₹<span>${item.price * item.quantity}</span>
                                </td>
                            </tr>
                        `;
                    });

                    totalEl.innerText = "₹" + data.total_price;
                    updateBadge(data.cart_count || data.items.length);
                })
                .catch(err => console.error("Error loading cart details:", err));
        }

        window.updateQty = function(id, type, targetQty) {
            if (targetQty < 0) return;

            // Enforce pet max qty of 1 on client side
            if (type === 'pet' && targetQty > 1) return;

            let method = "POST";
            let endpoint = "/api/cart/";
            let bodyData = {
                item_id: id,
                item_type: type,
                quantity: targetQty
            };

            if (targetQty === 0) {
                method = "DELETE";
            }

            fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify(bodyData)
            })
            .then(res => res.json())
            .then(data => {
                // Re-fetch cart to update UI smoothly
                loadCart();
            })
            .catch(err => console.error("Error updating cart qty:", err));
        };

        function updateBadge(count) {
            const badge = document.getElementById("cartBadge");
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? "inline-block" : "none";
            }
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
    });