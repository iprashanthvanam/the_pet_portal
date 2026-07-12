// Mobile menu toggle
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        const summaryItems = document.getElementById("summary-items");
        const summaryTotal = document.getElementById("summary-total-price");
        const checkoutForm = document.getElementById("checkoutForm");

        // Fetch Cart items dynamically
        fetch("/api/cart/")
            .then(res => res.json())
            .then(data => {
                summaryItems.innerHTML = "";
                if (data.items.length === 0) {
                    summaryItems.innerHTML = `<p style="color: var(--text-muted)">Your cart is empty.</p>`;
                    return;
                }
                data.items.forEach(item => {
                    summaryItems.innerHTML += `
                        <div class="summary-item">
                            <div class="item-details">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=f3f4f6&color=6366f1" class="item-img">
                                <div class="item-text">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-qty">Qty: ${item.quantity}</span>
                                </div>
                            </div>
                            <span class="item-price">₹${item.price}</span>
                        </div>
                    `;
                });
                summaryTotal.innerText = "₹" + data.total_price;
            });

        // Pre-fill Shipping Details from User Profile
        fetch("/api/profile/")
            .then(res => res.json())
            .then(data => {
                if (data) {
                    const firstName = (data.user && data.user.first_name) || "";
                    const lastName = (data.user && data.user.last_name) || "";
                    const fullName = [firstName, lastName].filter(Boolean).join(" ");
                    
                    if (fullName) document.getElementById("id_full_name").value = fullName;
                    if (data.user && data.user.email) document.getElementById("id_email").value = data.user.email;
                    if (data.phone) document.getElementById("id_mobile_number").value = data.phone;
                    if (data.address) document.getElementById("id_address").value = data.address;
                    if (data.city) document.getElementById("id_city").value = data.city;
                    if (data.postal_code) document.getElementById("id_postal_code").value = data.postal_code;
                }
            })
            .catch(err => console.error("Error fetching profile to prefill checkout:", err));

        // Handle checkout submission
        checkoutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Processing...';

            const fullName = document.getElementById("id_full_name").value;
            const email = document.getElementById("id_email").value;
            const mobileNumber = document.getElementById("id_mobile_number").value;
            const address = document.getElementById("id_address").value;
            const city = document.getElementById("id_city").value;
            const postalCode = document.getElementById("id_postal_code").value;
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

            fetch("/api/checkout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    mobile_number: mobileNumber,
                    address: address,
                    city: city,
                    postal_code: postalCode,
                    payment_method: paymentMethod
                })
            })
            .then(res => res.json())
            .then(data => {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;

                if (data.error) {
                    alert(data.error);
                } else if (data.order_id && (!data.razorpay)) {
                    window.location.href = `/order/success/${data.order_id}/`;
                } else if (data.razorpay) {
                    // Open Razorpay Checkout modal
                    const options = {
                        "key": data.razorpay.key,
                        "amount": data.razorpay.amount,
                        "currency": data.razorpay.currency,
                        "name": "The Pet Portal",
                        "description": "Secure checkout",
                        "order_id": data.razorpay.order_id,
                        "handler": function (response){
                            // Show loading while verifying payment
                            submitBtn.disabled = true;
                            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Verifying Payment...';

                            // Verify payment on backend
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
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = originalBtnText;
                                if (verifyData.error) {
                                    alert(verifyData.error);
                                } else {
                                    window.location.href = `/order/success/${verifyData.order_id}/`;
                                }
                            })
                            .catch(err => {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = originalBtnText;
                                console.error("Verify payment error:", err);
                            });
                        },
                        "modal": {
                            "ondismiss": function() {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = originalBtnText;
                            }
                        },
                        "prefill": {
                            "name": fullName,
                            "email": email,
                            "contact": mobileNumber
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
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                console.error("Checkout submission error:", err);
            });
        });

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