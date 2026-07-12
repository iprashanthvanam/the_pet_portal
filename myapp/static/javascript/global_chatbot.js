document.addEventListener("DOMContentLoaded", function() {
    // Inject Chatbot HTML structure if not already present
    if (!document.getElementById("chatbot-toggle")) {
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "chatbot-toggle";
        toggleBtn.innerHTML = '<i class="fa-regular fa-comment-dots"></i>';
        document.body.appendChild(toggleBtn);

        const container = document.createElement("div");
        container.id = "chatbot-container";
        container.innerHTML = `
            <div id="chatbot-header">PetPortal AI Assistant</div>
            <div id="chatbot-messages"></div>
            <div id="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Ask something..." autocomplete="off" />
                <button id="chatbot-send"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(container);
    }

    const toggleBtn = document.getElementById("chatbot-toggle");
    const container = document.getElementById("chatbot-container");
    const messagesBox = document.getElementById("chatbot-messages");
    const inputField = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    if (toggleBtn && container) {
        toggleBtn.onclick = () => {
            container.style.display = container.style.display === "flex" ? "none" : "flex";
        };
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

    function getHistoryKey() {
        const username = window.currentUsername || "anonymous";
        return "petportal_chat_history_" + username;
    }

    function loadChatHistory() {
        if (!messagesBox) return;
        messagesBox.innerHTML = "";
        const historyKey = getHistoryKey();
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
        if (history.length === 0) {
            addMessageToDOM("Hello! How can I help you today with your orders, bookings, pets, food, accessories or account details?", "bot-msg", false);
        } else {
            history.forEach(item => {
                addMessageToDOM(item.text, item.className, false);
            });
        }
    }

    function saveChatHistory(text, className) {
        const historyKey = getHistoryKey();
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
        history.push({ text: text, className: className });
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    function addMessageToDOM(text, className, save = true) {
        if (!messagesBox) return;
        const msg = document.createElement("div");
        msg.classList.add("chat-msg", className);
        msg.innerText = text;
        messagesBox.appendChild(msg);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        if (save) {
            saveChatHistory(text, className);
        }
    }

    function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;

        addMessageToDOM(message, "user-msg");
        inputField.value = "";

        const typing = document.createElement("div");
        typing.classList.add("chat-msg", "bot-msg");
        typing.innerText = "Typing...";
        messagesBox.appendChild(typing);
        messagesBox.scrollTop = messagesBox.scrollHeight;

        fetch("/api/chatbot/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken") || ""
            },
            body: JSON.stringify({ message: message })
        })
        .then(res => res.json())
        .then(data => {
            typing.remove();
            if (data.reply) {
                addMessageToDOM(data.reply, "bot-msg");
            } else {
                addMessageToDOM("Sorry, something went wrong.", "bot-msg");
            }
        })
        .catch(() => {
            typing.remove();
            addMessageToDOM("Server error. Try again later.", "bot-msg");
        });
    }

    if (sendBtn) {
        sendBtn.onclick = sendMessage;
    }
    if (inputField) {
        inputField.addEventListener("keypress", function(e) {
            if (e.key === "Enter") sendMessage();
        });
    }

    loadChatHistory();
});
