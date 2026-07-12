// 1. Sidebar Toggle
        function toggleMenu() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('sidebarOverlay').classList.toggle('active');
        }

        // 2. Razorpay Initialization (LOCKED LOGIC)
        document.addEventListener("DOMContentLoaded", function() {
            var options = {
                key: "{{ razorpay_key }}",
                amount: "{{ razorpay_amount }}",
                currency: "{{ currency }}",
                name: "The Pet Portal",
                description: "Order Checkout #{{ order.order_id|truncatechars:10 }}",
                order_id: "{{ razorpay_order_id }}",
                theme: {
                    color: "#6366f1" // Locked Indigo
                },
                handler: function (response) {
                    // Populate hidden form and submit
                    document.querySelector("[name=razorpay_payment_id]").value = response.razorpay_payment_id;
                    document.querySelector("[name=razorpay_order_id]").value = response.razorpay_order_id;
                    document.querySelector("[name=razorpay_signature]").value = response.razorpay_signature;
                    document.getElementById("razorpay-form").submit();
                },
                modal: {
                    ondismiss: function() {
                        // If user closes modal manually, redirect back to checkout
                        window.location.href = "{% url 'checkout' %}";
                    }
                }
            };

            // Auto-open Razorpay Modal
            var rzp1 = new Razorpay(options);
            rzp1.open();

            // 🔄 Fallback polling for status verification
            setInterval(() => {
                fetch("/payment/verify-status/{{ razorpay_order_id }}/")
                    .then(r => r.json())
                    .then(d => {
                        if (d.status === "PAID") {
                            window.location.href = "/order/success/{{ order.order_id }}/";
                        }
                    })
                    .catch(err => console.error("Verify polling error:", err));
            }, 5000);
        });