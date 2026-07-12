// --- Mobile Sidebar Toggle Logic ---
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    // --- Dynamic Search Suggestions Autocomplete ---
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestionsBox");

    if (searchInput) {
        searchInput.addEventListener("keyup", function() {
            const query = this.value;

            if (query.length < 2) {
                suggestionsBox.style.display = "none";
                return;
            }

            fetch(`/search-suggestions/?q=${query}`)
                .then(res => res.json())
                .then(data => {
                    suggestionsBox.innerHTML = "";

                    if (data.suggestions.length === 0) {
                        suggestionsBox.style.display = "none";
                        return;
                    }

                    data.suggestions.forEach(item => {
                        const div = document.createElement("div");
                        div.className = "suggestion-item";
                        div.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="margin-right:8px; color:#9ca3af;"></i> ${item}`;
                        div.addEventListener("click", () => {
                            searchInput.value = item;
                            suggestionsBox.style.display = "none";
                            document.querySelector('.search-form').submit(); 
                        });
                        suggestionsBox.appendChild(div);
                    });

                    suggestionsBox.style.display = "block";
                });
        });
    }

    // Close suggestions on outside click
    document.addEventListener('click', function(e) {
        if (searchInput && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });

    // --- Dynamic Catalog Load & Cart Logic ---
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        const species = urlParams.get('species') || '';
        const minPrice = urlParams.get('min_price') || '';
        const maxPrice = urlParams.get('max_price') || '';
        const fresh = urlParams.get('fresh') || '';

        let apiUrl = `/api/catalog/?q=${query}&species=${species}&min_price=${minPrice}&max_price=${maxPrice}&fresh=${fresh}`;

        // Store cart lookup globally so we can update it without re-fetching catalog
        let globalCartLookup = {};

        // Fetch catalog items
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                renderCatalog(data);
                updateBadge(data.cart_count);
            })
            .catch(err => console.error("Error loading catalog:", err));

        function renderCatalog(data) {
            const petsGrid = document.getElementById("pets-grid");
            const foodGrid = document.getElementById("food-grid");
            const accGrid = document.getElementById("accessories-grid");

            // Clear
            petsGrid.innerHTML = "";
            foodGrid.innerHTML = "";
            accGrid.innerHTML = "";

            // Fetch cart to check current quantities
            fetch("/api/cart/")
                .then(res => res.json())
                .then(cartData => {
                    globalCartLookup = {};
                    cartData.items.forEach(item => {
                        globalCartLookup[`${item.type}_${item.id}`] = item.quantity;
                    });

                    // Helper functions
                    function getStarsHTML(rating) {
                        const fullStars = Math.floor(rating);
                        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
                        const emptyStars = 5 - fullStars - halfStar;
                        let html = '';
                        for (let i = 0; i < fullStars; i++) html += '<i class="fa-solid fa-star"></i>';
                        if (halfStar) html += '<i class="fa-solid fa-star-half-stroke"></i>';
                        for (let i = 0; i < emptyStars; i++) html += '<i class="fa-regular fa-star"></i>';
                        return html;
                    }

                    function getPetTitle(pet) {
                        const ageLabel = pet.age !== undefined && pet.age !== null ? (pet.age + " Year Old") : "Young";
                        const vaccinatedLabel = pet.vaccinated ? "Vaccinated" : "Healthy";
                        return `${pet.name} - ${ageLabel} ${pet.species || "Pet"}, ${vaccinatedLabel} Pedigree Pet`;
                    }

                    function getFoodTitle(food) {
                        const brand = food.brand || "Premium";
                        const weight = food.weight_kg ? (food.weight_kg + " kg") : "10 kg";
                        return `${brand} Premium ${food.food_type || ''} Pet Food for ${food.name}, ${weight} Bag`;
                    }

                    function getAccTitle(acc) {
                        const brand = acc.brand || "Premium";
                        const size = acc.size || "One Size";
                        const color = acc.color || "Standard Color";
                        return `${brand} Durable ${acc.name} (${acc.category}) for ${acc.pet_type || 'Pets'} - ${size}, ${color}`;
                    }

                    function getActionHTML(type, id, qty) {
                        if (qty > 0) {
                            // For pets, max qty is 1 — disable the + button
                            const isPet = type === 'pet';
                            const plusDisabled = isPet ? 'disabled' : '';
                            const plusClass = isPet ? 'btn-qty btn-plus btn-qty-disabled' : 'btn-qty btn-plus';
                            return `
                                <div class="quantity-mutator" onclick="event.preventDefault(); event.stopPropagation();">
                                    <button class="btn-qty btn-minus" onclick="event.stopPropagation(); changeQty(${id}, '${type}', ${qty - 1})">-</button>
                                    <span class="qty-display">${qty}</span>
                                    <button class="${plusClass}" ${plusDisabled} onclick="event.stopPropagation(); changeQty(${id}, '${type}', ${qty + 1})">+</button>
                                </div>
                            `;
                        }
                        return `<button class="btn-add-to-cart" onclick="event.stopPropagation(); changeQty(${id}, '${type}', 1)">Add to cart</button>`;
                    }

                    function buildCard(item, type, title) {
                        const ratingAvg = item.rating_avg !== undefined ? item.rating_avg : 0;
                        const ratingCount = item.rating_count !== undefined ? item.rating_count : 0;
                        const boughtCount = item.bought_past_month_count !== undefined ? item.bought_past_month_count : 5;
                        const isPrime = item.is_prime_eligible !== undefined ? item.is_prime_eligible : true;
                        const mrpValue = item.mrp || (parseFloat(item.price) * 1.25);
                        const discount = item.discount_percentage || 20;
                        const qty = globalCartLookup[`${type}_${item.id}`] || 0;
                        const starsHTML = getStarsHTML(ratingAvg);
                        const primeBadgeHTML = isPrime ? `<span class="prime-badge"><i class="fa-solid fa-crown" style="color: #fbbf24;"></i> Prime</span>` : '';
                        const actionHTML = getActionHTML(type, item.id, qty);

                        const mediaUrls = [];
                        if (item.image) mediaUrls.push({ type: 'image', url: item.image });
                        if (item.image2) mediaUrls.push({ type: 'image', url: item.image2 });
                        if (item.video) mediaUrls.push({ type: 'video', url: item.video });
                        
                        if (mediaUrls.length === 0) {
                            mediaUrls.push({ type: 'image', url: 'https://via.placeholder.com/150' });
                            mediaUrls.push({ type: 'image', url: 'https://via.placeholder.com/150?text=Image+2' });
                        } else if (mediaUrls.length === 1) {
                            mediaUrls.push({ type: 'image', url: mediaUrls[0].url });
                        }
                        
                        let carouselId = `carousel-pets-${type}-${item.id}`;
                        let carouselItems = mediaUrls.map((media, idx) => {
                            if (media.type === 'video') {
                                return `
                                    <div class="carousel-slide" style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                        <video src="${media.url}" autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover;" onclick="event.stopPropagation(); this.paused ? this.play() : this.pause();"></video>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div class="carousel-slide" style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                        <img src="${media.url}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                `;
                            }
                        }).join('');

                        let indicatorItems = mediaUrls.map((_, idx) => `
                            <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); scrollCarousel('${carouselId}', ${idx})" style="height: 8px; width: 8px; margin: 0 3px; background-color: ${idx === 0 ? 'var(--primary)' : '#bbb'}; border-radius: 50%; display: inline-block; cursor: pointer; transition: background-color 0.2s;"></span>
                        `).join('');

                        return `
                            <div class="item-card" data-item-key="${type}_${item.id}" onclick="window.location.href='/${type}/${item.id}/'">
                                <div class="item-image-container" style="position: relative; overflow: hidden; width: 180px; height: 180px; min-width: 180px; border-radius: 8px;">
                                    <div id="${carouselId}" class="carousel-track" style="display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                                        ${carouselItems}
                                    </div>
                                    <div class="carousel-dots-container" style="position: absolute; bottom: 8px; width: 100%; text-align: center; z-index: 10;">
                                        ${indicatorItems}
                                    </div>
                                </div>
                                <div class="item-info">
                                    <h3 class="item-title-brand">${title}</h3>
                                    <div class="rating-row">
                                        <span class="stars">${starsHTML}</span>
                                        <span class="rating-count">${ratingAvg} out of 5 stars (${ratingCount} ratings)</span>
                                    </div>
                                    <div class="velocity-label">${boughtCount}+ bought in past month</div>
                                    <div class="price-block">
                                        <span class="current-price">₹${item.price}</span>
                                        <span class="mrp-price">M.R.P.: ₹${parseFloat(mrpValue).toFixed(2)}</span>
                                        <span class="discount-badge">(${discount}% off)</span>
                                    </div>
                                    <div class="logistics-line">
                                        <span>FREE Delivery Tue, 14 Jul</span>
                                        ${primeBadgeHTML}
                                    </div>
                                    <div class="action-area-inline" style="margin-top: 5px;">
                                        ${actionHTML}
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    // 1. Pets
                    if (data.pets.length === 0) {
                        petsGrid.innerHTML = `<p style="color: var(--text-muted);">No pets found.</p>`;
                    } else {
                        data.pets.forEach(pet => {
                            petsGrid.innerHTML += buildCard(pet, 'pet', getPetTitle(pet));
                        });
                    }

                    // 2. Food
                    if (data.foods.length === 0) {
                        foodGrid.innerHTML = `<p style="color: var(--text-muted);">No food items found.</p>`;
                    } else {
                        data.foods.forEach(food => {
                            foodGrid.innerHTML += buildCard(food, 'food', getFoodTitle(food));
                        });
                    }

                    // 3. Accessories
                    if (data.accessories.length === 0) {
                        accGrid.innerHTML = `<p style="color: var(--text-muted);">No accessories found.</p>`;
                    } else {
                        data.accessories.forEach(acc => {
                            accGrid.innerHTML += buildCard(acc, 'accessory', getAccTitle(acc));
                        });
                    }
                });
        }

        // Helper to update just the action area of a single card without re-rendering the entire catalog
        function updateCardAction(type, id, newQty) {
            const card = document.querySelector(`[data-item-key="${type}_${id}"]`);
            if (!card) return;
            const actionArea = card.querySelector('.action-area-inline');
            if (!actionArea) return;

            if (newQty > 0) {
                const isPet = type === 'pet';
                const plusDisabled = isPet ? 'disabled' : '';
                const plusClass = isPet ? 'btn-qty btn-plus btn-qty-disabled' : 'btn-qty btn-plus';
                actionArea.innerHTML = `
                    <div class="quantity-mutator" onclick="event.preventDefault(); event.stopPropagation();">
                        <button class="btn-qty btn-minus" onclick="event.stopPropagation(); changeQty(${id}, '${type}', ${newQty - 1})">-</button>
                        <span class="qty-display">${newQty}</span>
                        <button class="${plusClass}" ${plusDisabled} onclick="event.stopPropagation(); changeQty(${id}, '${type}', ${newQty + 1})">+</button>
                    </div>
                `;
            } else {
                actionArea.innerHTML = `<button class="btn-add-to-cart" onclick="event.stopPropagation(); changeQty(${id}, '${type}', 1)">Add to cart</button>`;
            }
        }

        window.changeQty = function(id, type, targetQty) {
            if (targetQty < 0) return;

            // Enforce pet max qty of 1 on the client side too
            if (type === 'pet' && targetQty > 1) return;

            let method = "POST";
            let bodyData = {
                item_id: id,
                item_type: type,
                quantity: targetQty
            };

            let endpoint = "/api/cart/";
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
                // Update cart lookup locally
                const key = `${type}_${id}`;
                if (targetQty === 0) {
                    delete globalCartLookup[key];
                } else {
                    globalCartLookup[key] = targetQty;
                }

                // Update just this card's action area (no full re-render)
                updateCardAction(type, id, targetQty);

                // Update cart badge count
                const cartCount = Object.keys(globalCartLookup).length;
                updateBadge(cartCount);
            })
            .catch(err => console.error("Error updating qty:", err));
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

    // --- Chatbot Logic ---
    const toggleBtn = document.getElementById("chatbot-toggle");
    const container = document.getElementById("chatbot-container");
    const messagesBox = document.getElementById("chatbot-messages");
    const inputField = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            container.style.display = container.style.display === "flex" ? "none" : "flex";
        };
    }

    function loadChatHistory() {
        if (!messagesBox) return;
        messagesBox.innerHTML = "";
        const history = JSON.parse(localStorage.getItem("petportal_chat_history") || "[]");
        if (history.length === 0) {
            // Default greeting
            addMessageToDOM("Hello! How can I help you today with your orders, bookings, pets, food, accessories or account details?", "bot-msg", false);
        } else {
            history.forEach(item => {
                addMessageToDOM(item.text, item.className, false);
            });
        }
    }

    function saveChatHistory(text, className) {
        const history = JSON.parse(localStorage.getItem("petportal_chat_history") || "[]");
        history.push({ text: text, className: className });
        localStorage.setItem("petportal_chat_history", JSON.stringify(history));
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
                "X-CSRFToken": getCsrfToken()
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

    // Load history on load
    loadChatHistory();

    // --- Overall Portal Reviews Logic ---
    function loadOverallReviews() {
        fetch("/api/reviews/")
            .then(res => res.json())
            .then(reviews => {
                // Calculate overall aggregates
                const totalRatings = reviews.length;
                let averageRating = 0;
                const starCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
                
                if (totalRatings > 0) {
                    let totalStars = 0;
                    reviews.forEach(r => {
                        totalStars += r.rating;
                        if (starCounts[r.rating] !== undefined) {
                            starCounts[r.rating]++;
                        }
                    });
                    averageRating = (totalStars / totalRatings).toFixed(1);
                }

                // Render overall aggregates elements
                const overallStarsAgg = document.getElementById("overall-stars-agg-container");
                if (overallStarsAgg) {
                    const fullStars = Math.floor(averageRating);
                    const halfStar = averageRating % 1 >= 0.5 ? 1 : 0;
                    const emptyStars = 5 - fullStars - halfStar;
                    let aggStarsHTML = "";
                    for (let i = 0; i < fullStars; i++) aggStarsHTML += '<i class="fa-solid fa-star"></i>';
                    if (halfStar) aggStarsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
                    for (let i = 0; i < emptyStars; i++) aggStarsHTML += '<i class="fa-regular fa-star"></i>';
                    overallStarsAgg.innerHTML = aggStarsHTML;
                }

                const overallAverageText = document.getElementById("overall-average-rating-text");
                if (overallAverageText) {
                    overallAverageText.innerText = `${averageRating} out of 5`;
                }

                const overallTotalText = document.getElementById("overall-total-ratings-text");
                if (overallTotalText) {
                    overallTotalText.innerText = `${totalRatings} global ratings`;
                }

                // Render distribution bars
                const distBars = document.getElementById("overall-distribution-bars");
                if (distBars) {
                    distBars.innerHTML = "";
                    for (let stars = 5; stars >= 1; stars--) {
                        const count = starCounts[stars] || 0;
                        const percent = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                        distBars.innerHTML += `
                            <div style="display: flex; align-items: center; gap: 15px; font-size: 14px; width: 100%;">
                                <span style="min-width: 50px; color: var(--primary); font-weight: 550;">${stars} star</span>
                                <div style="flex: 1; height: 16px; background: var(--bg-body); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);">
                                    <div style="width: ${percent}%; height: 100%; background: #f59e0b; border-radius: 4px;"></div>
                                </div>
                                <span style="min-width: 45px; text-align: right; color: var(--text-muted); font-weight: 500;">${percent}%</span>
                            </div>
                        `;
                    }
                }

                const feed = document.getElementById("reviews-feed");
                feed.innerHTML = "";
                if (reviews && reviews.length > 0) {
                    reviews.forEach(review => {
                        // Display the target asset name dynamically
                        let targetAsset = "Portal Experience";
                        if (review.pet) targetAsset = `Pet Listing`;
                        if (review.food) targetAsset = `Food Item`;
                        if (review.accessory) targetAsset = `Accessory`;
                        if (review.service_type === "DOCTOR") targetAsset = `Doctor Appointment`;
                        if (review.service_type === "PET_CARE") targetAsset = `Pet Care Boarding`;
                        if (review.service_type === "GROOMING") targetAsset = `Grooming Session`;

                        const fullStars = Math.floor(review.rating);
                        const emptyStars = 5 - fullStars;
                        let revStars = "";
                        for (let i = 0; i < fullStars; i++) revStars += '<i class="fa-solid fa-star"></i>';
                        for (let i = 0; i < emptyStars; i++) revStars += '<i class="fa-regular fa-star"></i>';
                        
                        const revDate = new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: 'numeric', month: 'long', year: 'numeric'
                        });
                        
                        let reviewImageHTML = '';
                        const rMedia = [];
                        if (review.image) rMedia.push({ type: 'image', url: review.image });
                        if (review.video) rMedia.push({ type: 'video', url: review.video });
                        if (review.media_files && review.media_files.length > 0) {
                            review.media_files.forEach(m => {
                                rMedia.push({ type: m.is_video ? 'video' : 'image', url: m.file });
                            });
                        }

                        if (rMedia.length > 0) {
                            if (rMedia.length === 1) {
                                const item = rMedia[0];
                                if (item.type === 'video') {
                                    reviewImageHTML = `
                                        <div style="margin-top: 10px; max-width: 250px; height: 150px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                                            <video src="${item.url}" controls preload="none" style="width: 100%; height: 100%; object-fit: cover;"></video>
                                        </div>
                                    `;
                                } else {
                                    reviewImageHTML = `
                                        <div style="margin-top: 10px;">
                                            <img src="${item.url}" alt="Review image" style="max-width: 150px; max-height: 150px; border-radius: 4px; border: 1px solid var(--border-color); object-fit: cover; cursor: pointer;" onclick="window.open('${item.url}', '_blank')">
                                        </div>
                                    `;
                                }
                            } else {
                                const carouselId = `overall-review-carousel-${review.id}`;
                                const slides = rMedia.map((m, idx) => {
                                    if (m.type === 'video') {
                                        return `
                                            <div style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                                <video src="${m.url}" controls muted preload="none" style="width: 100%; height: 100%; object-fit: cover;"></video>
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

                                const dots = rMedia.map((_, idx) => {
                                    return `<span class="carousel-dot${idx === 0 ? ' active' : ''}" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(-${idx * 100}%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===${idx}?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: ${idx === 0 ? 'var(--primary)' : '#bbb'}; border-radius: 50%; display: inline-block; cursor: pointer;"></span>`;
                                }).join('');

                                reviewImageHTML = `
                                    <div style="margin-top: 10px; position: relative; overflow: hidden; width: 200px; height: 150px; border-radius: 6px; border: 1px solid var(--border-color);">
                                        <div id="${carouselId}" style="display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                                            ${slides}
                                        </div>
                                        <div style="position: absolute; bottom: 5px; width: 100%; text-align: center; z-index: 10;">
                                            ${dots}
                                        </div>
                                    </div>
                                `;
                            }
                        }

                        let repliesHTML = '';
                        if (review.replies && review.replies.length > 0) {
                            review.replies.forEach(reply => {
                                const badge = reply.is_master_admin ? 
                                    '<span style="background: var(--secondary); color: black; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Master Admin</span>' :
                                    '<span style="background: var(--primary); color: white; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Seller Reply</span>';
                                const repDate = new Date(reply.created_at).toLocaleDateString("en-IN", {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                });
                                repliesHTML += `
                                    <div style="margin-left: 40px; margin-top: 10px; padding: 12px; background: var(--bg-body); border-left: 3px solid var(--primary); border-radius: 4px; box-sizing: border-box; max-width: calc(100% - 40px);">
                                        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: var(--text-main); flex-wrap: wrap;">
                                            <span>${reply.username}</span>
                                            ${badge}
                                            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal; margin-left: auto;">${repDate}</span>
                                        </div>
                                        <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin: 0; white-space: pre-wrap; word-break: break-word;">${reply.reply_text}</p>
                                    </div>
                                `;
                            });
                        }

                        let replyFormHTML = '';
                        const userRole = window.currentUserRole;
                        const isSuper = window.currentUserIsSuperuser;
                        
                        // Establish permission validation matching the backend logic
                        let canReply = false;
                        if (isSuper || userRole === 'master_admin') {
                            canReply = true;
                        } else if (userRole === 'pet_seller' && review.pet) {
                            canReply = true;
                        } else if (userRole === 'product_seller' && review.product) {
                            canReply = true;
                        } else if ((userRole === 'product_seller' || userRole === 'food_seller') && review.food) {
                            canReply = true;
                        } else if ((userRole === 'accessory_seller' || userRole === 'product_seller') && review.accessory) {
                            canReply = true;
                        } else if (userRole === 'doctor' && review.service_type === 'DOCTOR') {
                            canReply = true;
                        } else if (userRole === 'pet_care' && review.service_type === 'PET_CARE') {
                            canReply = true;
                        } else if (userRole === 'pet_grooming' && review.service_type === 'GROOMING') {
                            canReply = true;
                        }

                        if (canReply) {
                            replyFormHTML = `
                                <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-left: 40px; margin-top: 12px; display: flex; gap: 10px;">
                                    <input type="text" placeholder="Write a public reply..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                                    <button type="submit" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Reply</button>
                                </form>
                            `;
                        }

                        feed.innerHTML += `
                            <div class="review-item" style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 15px; width: 100%;">
                                <div class="reviewer-profile" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div class="reviewer-avatar" style="width: 32px; height: 32px; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%;">${review.username[0].toUpperCase()}</div>
                                    <span style="font-size: 15px; font-weight: 600; color: var(--text-main);">${review.username}</span>
                                    <span style="font-size: 12px; color: var(--primary); background: rgba(99, 102, 241, 0.1); padding: 2px 8px; border-radius: 12px; margin-left: auto;">${targetAsset}</span>
                                </div>
                                <div class="review-title-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                    <span class="stars" style="font-size: 16px; color: #f59e0b;">${revStars}</span>
                                    <span class="review-title" style="font-size: 15px; font-weight: 600; color: var(--text-main);">${review.title || 'Verified Purchase'}</span>
                                </div>
                                <div class="review-date" style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Reviewed in India on ${revDate}</div>
                                <p class="review-comment" style="font-size: 15px; color: var(--text-main); line-height: 1.6; word-break: break-word; white-space: pre-wrap; margin-bottom: 10px;">${review.comment || 'No comment provided.'}</p>
                                ${reviewImageHTML}
                                <div class="review-replies-container">
                                    ${repliesHTML}
                                </div>
                                ${replyFormHTML}
                            </div>
                        `;
                    });
                } else {
                    feed.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No portal reviews left yet. Be the first to share your experience!</p>`;
                }
            })
            .catch(err => console.error("Error loading reviews:", err));
    }

    // Initialize Star options clicking
    const starOptions = document.querySelectorAll(".star-option");
    starOptions.forEach(star => {
        star.addEventListener("click", function() {
            const val = parseInt(this.getAttribute("data-val"));
            document.getElementById("review-rating-val").value = val;
            starOptions.forEach(s => {
                const sVal = parseInt(s.getAttribute("data-val"));
                if (sVal <= val) {
                    s.classList.remove("fa-regular");
                    s.classList.add("fa-solid");
                } else {
                    s.classList.remove("fa-solid");
                    s.classList.add("fa-regular");
                }
            });
        });
    });

    // Accumulate files to allow multiple selections sequentially
    let selectedFiles = [];
    const fileInput = document.getElementById("review-image");
    const previewContainer = document.getElementById("review-media-preview");

    if (fileInput && previewContainer) {
        fileInput.addEventListener("change", function() {
            const files = Array.from(fileInput.files);
            files.forEach(f => {
                selectedFiles.push(f);
            });
            renderSelectedPreviews();
            // Clear input value so same file can be selected again
            fileInput.value = "";
        });
    }

    function renderSelectedPreviews() {
        if (!previewContainer) return;
        previewContainer.innerHTML = "";
        selectedFiles.forEach((file, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.style.cssText = "position: relative; width: 60px; height: 60px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);";
            
            if (file.type.startsWith("image/")) {
                const img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.style.cssText = "width:100%; height:100%; object-fit:cover;";
                itemDiv.appendChild(img);
            } else {
                const placeholder = document.createElement("div");
                placeholder.style.cssText = "width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#374151; color:#fff; font-size:10px;";
                placeholder.innerText = "VIDEO";
                itemDiv.appendChild(placeholder);
            }

            const removeBtn = document.createElement("span");
            removeBtn.innerHTML = "&times;";
            removeBtn.style.cssText = "position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; border-bottom-left-radius: 4px;";
            removeBtn.onclick = function() {
                selectedFiles.splice(index, 1);
                renderSelectedPreviews();
            };
            itemDiv.appendChild(removeBtn);
            previewContainer.appendChild(itemDiv);
        });
    }

    window.submitOverallReview = function(e) {
        e.preventDefault();
        const rating = document.getElementById("review-rating-val").value;
        const submitBtn = e.target.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerHTML : "Submit Feedback";

        function showStatus(type, text) {
            const form = document.getElementById("write-review-form");
            const existing = form.querySelector('.review-status-msg');
            if (existing) existing.remove();
            const msg = document.createElement("div");
            msg.className = "review-status-msg";
            msg.style.cssText = `margin-bottom: 12px; padding: 8px 10px; border-radius: 4px; font-size: 13px; text-align: center; font-weight: 550;`;
            if (type === "error") {
                msg.style.background = "rgba(239, 68, 68, 0.15)";
                msg.style.color = "#f87171";
                msg.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            } else {
                msg.style.background = "rgba(34, 197, 94, 0.15)";
                msg.style.color = "#4ade80";
                msg.style.border = "1px solid rgba(34, 197, 94, 0.3)";
            }
            msg.innerText = text;
            form.insertBefore(msg, form.firstChild);
            setTimeout(() => msg.remove(), 4000);
        }

        if (!rating) {
            showStatus("error", "Please select a rating!");
            return;
        }
        const title = document.getElementById("review-title").value;
        const comment = document.getElementById("review-comment").value;

        const formData = new FormData();
        formData.append("rating", rating);
        formData.append("title", title);
        formData.append("comment", comment);
        
        // Append all accumulated images/videos to key 'media_files'
        selectedFiles.forEach(file => {
            formData.append("media_files", file);
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

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        }

        fetch("/api/reviews/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCookie('csrftoken')
            },
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw err; });
            }
            return res.json();
        })
        .then(data => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            document.getElementById("write-review-form").reset();
            document.getElementById("review-rating-val").value = "";
            selectedFiles = [];
            renderSelectedPreviews();
            const starsReset = document.querySelectorAll(".star-option");
            starsReset.forEach(s => {
                s.classList.remove("fa-solid");
                s.classList.add("fa-regular");
            });
            showStatus("success", "Review submitted successfully!");
            loadOverallReviews();
        })
        .catch(err => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            console.error("Error submitting review:", err);
            showStatus("error", "Failed to submit: " + (err.error || JSON.stringify(err)));
        });
    };

        window.submitReviewReply = function(event, reviewId) {
            event.preventDefault();
            const form = event.target;
            const replyText = form.querySelector('input[type="text"]').value.trim();
            if (!replyText) return;

            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            fetch(`/api/reviews/${reviewId}/reply/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({ reply_text: replyText })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || "Failed to submit reply") });
                }
                return res.json();
            })
            .then(data => {
                form.reset();
                loadOverallReviews(); // Reload to render new replies
            })
            .catch(err => {
                alert(err.message);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        };

        // Load portal reviews initially
        loadOverallReviews();

        window.scrollCarousel = function(carouselId, idx) {
            const track = document.getElementById(carouselId);
            if (!track) return;
            track.style.transform = `translateX(-${idx * 100}%)`;
            
            const container = track.parentElement;
            const dots = container.querySelectorAll('.carousel-dot');
            dots.forEach((dot, dIdx) => {
                if (dIdx === idx) {
                    dot.style.backgroundColor = 'var(--primary)';
                } else {
                    dot.style.backgroundColor = '#bbb';
                }
            });
        };