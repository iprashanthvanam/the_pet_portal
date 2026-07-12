// --- Mobile Sidebar Toggle Logic ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function changeMainImage(event, src, isVideo) {
    if (event) {
        event.preventDefault();
        // Remove active class from all thumb boxes
        document.querySelectorAll('.thumb-box').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }
    const mainImg = document.getElementById('main-product-img');
    const mainVid = document.getElementById('main-product-video');
    if (isVideo) {
        if (mainImg) mainImg.style.display = 'none';
        if (mainVid) {
            mainVid.style.display = 'block';
            mainVid.src = src;
            mainVid.play().catch(e => console.log('Autoplay prevented'));
        }
    } else {
        if (mainVid) {
            mainVid.style.display = 'none';
            mainVid.pause();
        }
        if (mainImg) {
            mainImg.style.display = 'block';
            mainImg.src = src;
        }
    }
}

let userCartQty = 0;
const pathParts = window.location.pathname.split('/');
const itemId = parseInt(pathParts[2]);

document.addEventListener("DOMContentLoaded", function() {
    // 1. Fetch current cart quantity
    fetchCartInfo();
    // 2. Fetch pet details
    fetchPetDetails();
});

function fetchCartInfo() {
    fetch("/api/cart/")
        .then(res => res.json())
        .then(data => {
            const item = data.items.find(it => it.type === 'pet' && it.id === itemId);
            userCartQty = item ? item.quantity : 0;
            renderActionBox();
            
            const badge = document.getElementById("cartBadge");
            if (badge) {
                const total = data.items.reduce((acc, it) => acc + it.quantity, 0);
                badge.innerText = total;
                badge.style.display = total > 0 ? 'inline-block' : 'none';
            }
        })
        .catch(err => console.error("Error loading cart:", err));
}

function fetchPetDetails() {
    fetch(`/api/pets/${itemId}/`)
        .then(res => res.json())
        .then(data => {
            // Render descriptive title
            const ageLabel = data.age !== undefined && data.age !== null ? (data.age + " Year Old") : "Young";
            const vaccinatedLabel = data.vaccinated ? "Vaccinated" : "Healthy";
            const fullTitle = `${data.name} - ${ageLabel} ${data.species || "Pet"}, ${vaccinatedLabel} Pedigree Pet`;
            document.getElementById("pet-display-title").innerText = fullTitle;
            
            // Populate gallery with actual product image
            const mainImg = document.getElementById('main-product-img');
            const mainVid = document.getElementById('main-product-video');
            const thumbContainer = document.getElementById('detail-thumbnails-container');
            thumbContainer.innerHTML = '';

            const mediaItems = [];
            if (data.image) mediaItems.push({ type: 'image', url: data.image, label: 'Main Image' });
            if (data.image2) mediaItems.push({ type: 'image', url: data.image2, label: 'Image 2' });
            if (data.video) mediaItems.push({ type: 'video', url: data.video, label: 'Video Demo' });

            // Default fallbacks if empty
            if (mediaItems.length === 0) {
                mediaItems.push({ type: 'image', url: 'https://via.placeholder.com/400', label: 'Default Image' });
            }

            // Set initially loaded item
            const initialMedia = mediaItems[0];
            if (initialMedia.type === 'video') {
                if (mainImg) mainImg.style.display = 'none';
                if (mainVid) {
                    mainVid.style.display = 'block';
                    mainVid.src = initialMedia.url;
                }
            } else {
                if (mainVid) mainVid.style.display = 'none';
                if (mainImg) {
                    mainImg.style.display = 'block';
                    mainImg.src = initialMedia.url;
                }
            }

            mediaItems.forEach((media, idx) => {
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'thumb-box' + (idx === 0 ? ' active' : '');
                thumbDiv.onclick = function(e) { changeMainImage(e, media.url, media.type === 'video'); };
                
                if (media.type === 'video') {
                    thumbDiv.innerHTML = `<div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 4px;"><i class="fa-solid fa-play" style="color: white; font-size: 16px;"></i></div>`;
                } else {
                    const img = document.createElement('img');
                    img.src = media.url;
                    img.alt = media.label;
                    thumbDiv.appendChild(img);
                }
                thumbContainer.appendChild(thumbDiv);
            });
            
            // Set pricing details
            const mrpValue = data.mrp || (parseFloat(data.price) * 1.25);
            const discount = data.discount_percentage || 20;
            
            document.getElementById("detail-price").innerText = `₹${data.price}`;
            document.getElementById("purchase-price-tag").innerText = `₹${data.price}`;
            document.getElementById("detail-mrp").innerText = `₹${parseFloat(mrpValue).toFixed(2)}`;
            document.getElementById("detail-discount-percent").innerText = `-${discount}%`;
            
            // Prime eligibility
            const isPrime = data.is_prime_eligible !== undefined ? data.is_prime_eligible : true;
            if (!isPrime) {
                const badge = document.querySelector(".prime-badge");
                if (badge) badge.style.display = "none";
            }
            
            // Stock Alert
            const stockAlert = document.getElementById("stock-alert-text");
            if (data.stock <= 0) {
                stockAlert.innerText = "Out of Stock";
                stockAlert.style.color = "#ef4444";
            } else if (data.stock <= 3) {
                stockAlert.innerText = `Only ${data.stock} left in stock - order soon.`;
                stockAlert.style.color = "#f97316";
            } else {
                stockAlert.innerText = "In Stock";
                stockAlert.style.color = "#22c55e";
            }
            
            // Render specifications table
            const specsTable = document.getElementById("specs-grid-table");
            specsTable.innerHTML = `
                <tr>
                    <td class="label-cell">Species Type</td>
                    <td class="val-cell">${data.species || "Unknown"}</td>
                </tr>
                <tr>
                    <td class="label-cell">Age Bracket</td>
                    <td class="val-cell">${data.age !== null ? data.age + ' Years' : 'Puppy/Kitten'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Vaccination Status</td>
                    <td class="val-cell">${data.vaccinated ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Activity Requirement</td>
                    <td class="val-cell">${data.activity_level || 'Moderate'}</td>
                </tr>
            `;
            
            // Render Bullet points
            const bullets = document.getElementById("bullet-details-list");
            bullets.innerHTML = `
                <li>Beautiful and active ${data.species || "pet"} ready to bring joy to your home.</li>
                <li>Fully checked and authenticated pedigree profile.</li>
                <li>Comes with dynamic activity trackers and complete vaccination histories.</li>
                <li>Fulfillment processed securely via PetPortal Local Adoption.</li>
            `;
            
            // Render Rating summaries
            const stats = data.rating_stats;
            const starsHTML = getStarsHTML(stats.average_rating);
            
            document.getElementById("header-stars-container").innerHTML = starsHTML;
            document.getElementById("header-rating-avg-text").innerText = `${stats.average_rating} out of 5 stars (${stats.total_ratings} ratings)`;
            
            document.getElementById("agg-stars-container").innerHTML = starsHTML;
            document.getElementById("agg-rating-avg-text").innerText = `${stats.average_rating} out of 5`;
            document.getElementById("agg-rating-count-text").innerText = `${stats.total_ratings} global ratings`;
            
            // Distribution bars
            const distBars = document.getElementById("ratings-distribution-bars");
            distBars.innerHTML = "";
            for (let stars = 5; stars >= 1; stars--) {
                const percent = stats.stars_percentages[stars.toString()] || 0;
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
            
            // Render chronological reviews feed
            const feed = document.getElementById("reviews-feed");
            feed.innerHTML = "";
            if (data.reviews && data.reviews.length > 0) {
                data.reviews.forEach(review => {
                    const revStars = getStarsHTML(review.rating);
                    const revDate = new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    let reviewImageHTML = '';
                    const rMedia = [];
                    if (review.image) rMedia.push({ type: 'image', url: review.image });
                    if (review.video) rMedia.push({ type: 'video', url: review.video });

                    if (rMedia.length > 0) {
                        if (rMedia.length === 1) {
                            const item = rMedia[0];
                            if (item.type === 'video') {
                                reviewImageHTML = `
                                    <div style="margin-top: 10px; max-width: 250px; height: 150px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                                        <video src="${item.url}" controls style="width: 100%; height: 100%; object-fit: cover;"></video>
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
                            const carouselId = `detail-review-carousel-${review.id}`;
                            const slides = rMedia.map((m, idx) => {
                                if (m.type === 'video') {
                                    return `
                                        <div style="flex: 0 0 100%; width: 100%; height: 100%; position: relative;">
                                            <video src="${m.url}" controls muted style="width: 100%; height: 100%; object-fit: cover;"></video>
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

                            reviewImageHTML = `
                                <div style="margin-top: 10px; position: relative; overflow: hidden; width: 200px; height: 150px; border-radius: 6px; border: 1px solid var(--border-color);">
                                    <div id="${carouselId}" style="display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                                        ${slides}
                                    </div>
                                    <div style="position: absolute; bottom: 5px; width: 100%; text-align: center; z-index: 10;">
                                        <span class="carousel-dot active" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(0%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===0?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: var(--primary); border-radius: 50%; display: inline-block; cursor: pointer;"></span>
                                        <span class="carousel-dot" onclick="event.stopPropagation(); document.getElementById('${carouselId}').style.transform='translateX(-100%)'; this.parentElement.querySelectorAll('span').forEach((s,i)=>s.style.backgroundColor=i===1?'var(--primary)':'#bbb')" style="height: 6px; width: 6px; margin: 0 2px; background-color: #bbb; border-radius: 50%; display: inline-block; cursor: pointer;"></span>
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
                                <div style="margin-left: 40px; margin-top: 10px; padding: 12px; background: var(--bg-body); border-left: 3px solid var(--primary); border-radius: 4px;">
                                    <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: var(--text-main);">
                                        <span>${reply.username}</span>
                                        ${badge}
                                        <span style="font-size: 11px; color: var(--text-muted); font-weight: normal; margin-left: auto;">${repDate}</span>
                                    </div>
                                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.5; margin: 0; white-space: pre-wrap;">${reply.reply_text}</p>
                                </div>
                            `;
                        });
                    }

                    let replyFormHTML = '';
                    const userRole = window.currentUserRole;
                    const isSuper = window.currentUserIsSuperuser;
                    if (isSuper || userRole === 'master_admin' || userRole === 'pet_seller') {
                        replyFormHTML = `
                            <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-left: 40px; margin-top: 12px; display: flex; gap: 10px;">
                                <input type="text" placeholder="Write a public reply..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                                <button type="submit" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Reply</button>
                            </form>
                        `;
                    }

                    feed.innerHTML += `
                        <div class="review-item" style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 15px;">
                            <div class="reviewer-profile" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div class="reviewer-avatar" style="width: 32px; height: 32px; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%;">${review.username[0].toUpperCase()}</div>
                                <span style="font-size: 15px; font-weight: 600; color: var(--text-main);">${review.username}</span>
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
                feed.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No reviews left yet. Be the first to review this pet!</p>`;
            }
        })
        .catch(err => console.error("Error loading pet details:", err));
}

document.addEventListener("DOMContentLoaded", function() {
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
});

function submitReview(e) {
    e.preventDefault();
    const rating = document.getElementById("review-rating-val").value;
    const submitBtn = e.target.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerHTML : "Submit Review";

    // Setup visual status message banner
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
    const imgFile = document.getElementById("review-image").files[0];
    const vidFile = document.getElementById("review-video") ? document.getElementById("review-video").files[0] : null;

    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("title", title);
    formData.append("comment", comment);
    formData.append("pet", itemId);
    if (imgFile) {
        formData.append("image", imgFile);
    }
    if (vidFile) {
        formData.append("video", vidFile);
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    }

    // Get CSRF Token
    function getCSRF() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    fetch("/api/reviews/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRF()
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
        const starsReset = document.querySelectorAll(".star-option");
        starsReset.forEach(s => {
            s.classList.remove("fa-solid");
            s.classList.add("fa-regular");
        });
        showStatus("success", "Review submitted successfully!");
        fetchPetDetails();
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
        console.error("Error submitting review:", err);
        showStatus("error", "Failed to submit: " + (err.error || JSON.stringify(err)));
    });
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

function renderActionBox() {
    const actionBox = document.getElementById("detail-action-box");
    if (!actionBox) return;
    
    if (userCartQty > 0) {
        actionBox.innerHTML = `
            <div class="quantity-mutator" style="width: 100%; justify-content: space-between;">
                <button class="btn-qty btn-minus" onclick="changeDetailQty(-1)" style="flex: 1;">-</button>
                <span class="qty-display" style="flex: 1; text-align: center; padding-top: 6px;">${userCartQty}</span>
                <button class="btn-qty btn-plus" onclick="changeDetailQty(1)" style="flex: 1;" ${userCartQty >= 1 ? 'disabled' : ''}>+</button>
            </div>
        `;
    } else {
        actionBox.innerHTML = `
            <button class="btn-add-to-cart" onclick="addDetailToCart()">Add to cart</button>
        `;
    }
}

function addDetailToCart() {
    updateCartItem(1);
}

function changeDetailQty(delta) {
    const newQty = userCartQty + delta;
    // Enforce max qty of 1 for pets
    if (newQty > 1) return;
    if (newQty <= 0) {
        deleteCartItem();
    } else {
        updateCartItem(newQty);
    }
}

function updateCartItem(quantity) {
    fetch("/api/cart/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            item_type: "pet",
            item_id: itemId,
            quantity: quantity
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const item = data.cart.find(it => it.type === 'pet' && it.id === itemId);
            userCartQty = item ? item.quantity : 0;
            renderActionBox();
            
            const badge = document.getElementById("cartBadge");
            if (badge) {
                const total = data.cart.reduce((acc, it) => acc + it.quantity, 0);
                badge.innerText = total;
                badge.style.display = total > 0 ? 'inline-block' : 'none';
            }
        }
    })
    .catch(err => console.error("Error updating cart:", err));
}

function deleteCartItem() {
    fetch("/api/cart/", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            item_type: "pet",
            item_id: itemId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            userCartQty = 0;
            renderActionBox();
            
            const badge = document.getElementById("cartBadge");
            if (badge) {
                const total = data.cart.reduce((acc, it) => acc + it.quantity, 0);
                badge.innerText = total;
                badge.style.display = total > 0 ? 'inline-block' : 'none';
            }
        }
    })
    .catch(err => console.error("Error deleting item:", err));
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

function submitReviewReply(event, reviewId) {
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
        loadDetails(); // Reload to render new replies
    })
    .catch(err => {
        alert(err.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    });
}