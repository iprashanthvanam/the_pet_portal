// --- Mobile Sidebar Toggle Logic ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// --- Profile Dropdown Toggle Logic ---
function toggleProfileDropdown() {
    document.getElementById('profileDropdown').classList.toggle('active');
}

// Close dropdown when clicking anywhere outside of it
document.addEventListener('click', function(event) {
    const container = document.querySelector('.profile-menu-container');
    if (container) {
        var isClickInside = container.contains(event.target);
        if (!isClickInside) {
            var dropdown = document.getElementById('profileDropdown');
            if (dropdown && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        }
    }
});

let userCart = {};
let responseData = {};

// --- Dynamic API Fetch Logic ---
document.addEventListener("DOMContentLoaded", function () {
    fetchCartAndData();
});

function fetchCartAndData() {
    // 1. Fetch Cart Info first if authenticated
    if (window.isUserAuthenticated) {
        fetch("/api/cart/")
            .then(res => res.json())
            .then(data => {
                userCart = {};
                if (data.items) {
                    data.items.forEach(item => {
                        userCart[`${item.type}_${item.id}`] = item.quantity;
                    });
                }
                updateCartCountDisplay(data.items ? data.items.reduce((acc, it) => acc + it.quantity, 0) : 0);
                fetchMarketplaceData();
            })
            .catch(err => {
                console.error("Error loading cart info:", err);
                fetchMarketplaceData();
            });
    } else {
        fetchMarketplaceData();
    }
}

function fetchMarketplaceData() {
    fetch("/api/home-data/")
        .then(response => response.json())
        .then(data => {
            responseData = data;
            
            // Build Accessories Section dynamically if it doesn't exist
            if (!document.getElementById("accessories-section")) {
                const accessoriesSection = document.createElement("div");
                accessoriesSection.id = "accessories-section";
                accessoriesSection.style.paddingTop = "20px";
                accessoriesSection.innerHTML = `
                    <div class="section-title">Pet Accessories 🛍</div>
                    <div class="dynamic-grid" id="accessoriesContainer"></div>
                `;
                document.querySelector(".content-wrapper").appendChild(accessoriesSection);
            }
            
            renderAllItems();
        })
        .catch(error => console.error("Home API Error:", error));
}

function renderAllItems() {
    const petsContainer = document.getElementById("petsContainer");
    const foodContainer = document.getElementById("foodContainer");
    const accessoriesContainer = document.getElementById("accessoriesContainer");

    if (petsContainer) petsContainer.innerHTML = "";
    if (foodContainer) foodContainer.innerHTML = "";
    if (accessoriesContainer) accessoriesContainer.innerHTML = "";

    // ================= PETS =================
    if (responseData.pets && petsContainer) {
        responseData.pets.forEach(pet => {
            petsContainer.innerHTML += getItemCardHTML(pet, 'pet');
        });
    }

    // ================= FOOD =================
    if (responseData.foods && foodContainer) {
        responseData.foods.forEach(food => {
            foodContainer.innerHTML += getItemCardHTML(food, 'food');
        });
    }

    // ================= ACCESSORIES =================
    if (responseData.accessories && accessoriesContainer) {
        responseData.accessories.forEach(acc => {
            accessoriesContainer.innerHTML += getItemCardHTML(acc, 'accessory');
        });
    }
}

// Formatting Title builders for Amazon-style
function getPetTitle(pet) {
    const ageLabel = pet.age !== undefined && pet.age !== null ? (pet.age + " Year Old") : "Young";
    const vaccinatedLabel = pet.vaccinated ? "Vaccinated" : "Healthy";
    return `${pet.name} - ${ageLabel} ${pet.species || "Pet"}, ${vaccinatedLabel} Pedigree Pet`;
}

function getFoodTitle(food) {
    const brand = food.brand || "Premium";
    const weight = food.weight_kg ? (food.weight_kg + " kg") : "10 kg";
    return `${brand} Premium ${food.food_type} Pet Food for ${food.name}, ${weight} Bag`;
}

function getAccessoryTitle(acc) {
    const brand = acc.brand || "Premium";
    const size = acc.size || "One Size";
    const color = acc.color || "Standard Color";
    return `${brand} Durable ${acc.name} (${acc.category}) for ${acc.pet_type} - ${size}, ${color}`;
}

function getStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fa-solid fa-star"></i>';
    }
    if (halfStar) {
        html += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="fa-regular fa-star"></i>';
    }
    return html;
}

function getItemCardHTML(item, itemType) {
    let title = "";
    if (itemType === 'pet') {
        title = getPetTitle(item);
    } else if (itemType === 'food') {
        title = getFoodTitle(item);
    } else if (itemType === 'accessory') {
        title = getAccessoryTitle(item);
    }
    
    const ratingAvg = item.rating_avg !== undefined ? item.rating_avg : 4.5;
    const ratingCount = item.rating_count !== undefined ? item.rating_count : 1850;
    const boughtCount = item.bought_past_month_count !== undefined ? item.bought_past_month_count : 50;
    const isPrime = item.is_prime_eligible !== undefined ? item.is_prime_eligible : true;
    const mrpValue = item.mrp || (parseFloat(item.price) * 1.25);
    const discount = item.discount_percentage || 20;
    
    const starsHTML = getStarsHTML(ratingAvg);
    const key = `${itemType}_${item.id}`;
    const qty = userCart[key] || 0;
    
    let actionHTML = '';
    if (qty > 0) {
        actionHTML = `
            <div class="quantity-mutator" onclick="event.preventDefault(); event.stopPropagation();">
                <button class="btn-qty btn-minus" onclick="changeQty(event, '${itemType}', ${item.id}, -1)">-</button>
                <span class="qty-display">${qty}</span>
                <button class="btn-qty btn-plus" onclick="changeQty(event, '${itemType}', ${item.id}, 1)">+</button>
            </div>
        `;
    } else {
        actionHTML = `
            <button class="btn-add-to-cart" onclick="addToCart(event, '${itemType}', ${item.id})">Add to cart</button>
        `;
    }
    
    const primeBadgeHTML = isPrime ? `
        <span class="prime-badge"><i class="fa-solid fa-crown" style="color: #fbbf24;"></i> Prime</span>
    ` : '';
    
    return `
    const mediaHtml = [];
    const mediaUrls = [];
    if (item.image) mediaUrls.push({ type: 'image', url: item.image });
    if (item.image2) mediaUrls.push({ type: 'image', url: item.image2 });
    if (item.video) mediaUrls.push({ type: 'video', url: item.video });
    
    // Add default fallbacks if none are available
    if (mediaUrls.length === 0) {
        mediaUrls.push({ type: 'image', url: 'https://via.placeholder.com/150' });
        mediaUrls.push({ type: 'image', url: 'https://via.placeholder.com/150?text=Image+2' });
    } else if (mediaUrls.length === 1) {
        mediaUrls.push({ type: 'image', url: mediaUrls[0].url });
    }
    
    let carouselId = `carousel-home-${itemType}-${item.id}`;
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
        <div class="item-card" onclick="goToDetail(event, '${itemType}', ${item.id})">
            <div class="item-image-container" style="position: relative; overflow: hidden; width: 100%; height: 200px; border-radius: 8px 8px 0 0;">
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
                <div class="velocity-label">${boughtCount > 0 ? boughtCount : 5}+ bought in past month</div>
                <div class="price-block">
                    <span class="current-price">₹${item.price}</span>
                    <span class="mrp-price">M.R.P.: ₹${parseFloat(mrpValue).toFixed(2)}</span>
                    <span class="discount-badge">(${discount}% off)</span>
                </div>
                <div class="logistics-line">
                    <span>FREE Delivery Tue, 14 Jul</span>
                    ${primeBadgeHTML}
                </div>
                <div style="margin-top: 5px;">
                    ${actionHTML}
                </div>
            </div>
        </div>
    `;
}

function goToDetail(event, itemType, id) {
    event.preventDefault();
    if (!window.isUserAuthenticated) {
        window.location.href = "/login/";
        return;
    }
    window.location.href = `/${itemType}/${id}/`;
}

function addToCart(event, itemType, itemId) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.isUserAuthenticated) {
        window.location.href = "/login/";
        return;
    }
    updateCartItem(itemType, itemId, 1);
}

function changeQty(event, itemType, itemId, delta) {
    event.preventDefault();
    event.stopPropagation();
    const key = `${itemType}_${itemId}`;
    const currentQty = userCart[key] || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
        deleteCartItem(itemType, itemId);
    } else {
        updateCartItem(itemType, itemId, newQty);
    }
}

function updateCartItem(itemType, itemId, quantity) {
    fetch("/api/cart/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            item_type: itemType,
            item_id: itemId,
            quantity: quantity
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            userCart = {};
            data.cart.forEach(item => {
                userCart[`${item.type}_${item.id}`] = item.quantity;
            });
            renderAllItems();
            updateCartCountDisplay(data.cart.reduce((acc, it) => acc + it.quantity, 0));
        }
    })
    .catch(err => console.error("Error updating cart:", err));
}

// Function to delete cart item
function deleteCartItem(itemType, itemId) {
    fetch("/api/cart/", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            item_type: itemType,
            item_id: itemId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            userCart = {};
            data.cart.forEach(item => {
                userCart[`${item.type}_${item.id}`] = item.quantity;
            });
            renderAllItems();
            updateCartCountDisplay(data.cart.reduce((acc, it) => acc + it.quantity, 0));
        }
    })
    .catch(err => console.error("Error deleting cart item:", err));
}

function updateCartCountDisplay(count) {
    const badge = document.querySelector(".badge-cart");
    if (badge) {
        badge.innerText = count;
        if (count === 0) {
            badge.style.display = "none";
        } else {
            badge.style.display = "inline-block";
        }
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

window.scrollCarousel = function(carouselId, idx) {
    const track = document.getElementById(carouselId);
    if (!track) return;
    track.style.transform = `translateX(-${idx * 100}%)`;
    
    // Update dots indicator active class
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