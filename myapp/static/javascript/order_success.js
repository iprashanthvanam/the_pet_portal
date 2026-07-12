// Mobile menu toggle
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    // Copy UUID to Clipboard Logic
    function copyOrderId() {
        const textToCopy = document.getElementById('orderUuidText').innerText;
        const copyBtn = document.getElementById('copyBtn');

        // Modern clipboard API
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback: change icon to green checkmark
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            copyBtn.classList.add('copied');

            // Reset back to copy icon after 2.5 seconds
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                copyBtn.classList.remove('copied');
            }, 2500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert("Failed to copy. Please try selecting the text manually.");
        });
    }