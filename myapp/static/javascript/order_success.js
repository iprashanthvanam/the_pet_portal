document.addEventListener("DOMContentLoaded", function() {
    const successCard = document.querySelector(".success-card");
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 2];

    if (orderId) {
        fetch(`/api/orders/${orderId}/`)
            .then(res => res.json())
            .then(data => {
                if (data.order_id) {
                    document.getElementById("orderUuidText").innerText = data.order_id;
                } else {
                    document.getElementById("orderUuidText").innerText = orderId;
                }
            })
            .catch(err => {
                console.error("Error fetching order details:", err);
                document.getElementById("orderUuidText").innerText = orderId;
            });
    }

    // Copy UUID to Clipboard Logic
    window.copyOrderId = function() {
        const textToCopy = document.getElementById('orderUuidText').innerText;
        const copyBtn = document.getElementById('copyBtn');

        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                copyBtn.classList.remove('copied');
            }, 2500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert("Failed to copy. Please try selecting the text manually.");
        });
    };
});