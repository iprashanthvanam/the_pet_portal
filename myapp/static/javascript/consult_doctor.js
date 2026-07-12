// Mobile menu toggle logic
    function toggleMenu() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }

    document.addEventListener("DOMContentLoaded", function () {
        const form = document.querySelector('form[method="POST"]');
        if (!form) return;

        let isSubmitting = false;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Prevent double submission
            if (isSubmitting) return;
            isSubmitting = true;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Booking...';

            // Collect form data - only fields in the DoctorAppointment model
            const formData = {
                pet_name: form.querySelector('[name="pet_name"]').value,
                pet_type: form.querySelector('[name="pet_type"]').value,
                appointment_date: form.querySelector('[name="appointment_date"]').value,
                appointment_time: form.querySelector('[name="appointment_time"]').value,
                symptoms: form.querySelector('[name="symptoms"]').value,
            };

            fetch('/api/bookings/doctor/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;

                if (ok) {
                    // Show success message and reset form
                    showMessage('success', 'Appointment booked successfully! Redirecting to history...');
                    form.reset();
                    setTimeout(() => {
                        window.location.href = '/appointments/';
                    }, 1500);
                } else {
                    // Show error
                    const errorMsg = data.error || Object.values(data).flat().join(', ') || 'Failed to book appointment.';
                    showMessage('error', errorMsg);
                }
            })
            .catch(err => {
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                showMessage('error', 'Network error. Please try again.');
                console.error('Booking error:', err);
            });
        });

        function showMessage(type, text) {
            // Remove existing messages
            const existing = document.querySelectorAll('.ajax-message');
            existing.forEach(el => el.remove());

            const msgDiv = document.createElement('div');
            msgDiv.className = `message ajax-message ${type}`;
            const icon = type === 'error' 
                ? '<i class="fa-solid fa-circle-exclamation"></i> ' 
                : '<i class="fa-solid fa-circle-check"></i> ';
            msgDiv.innerHTML = icon + text;
            msgDiv.style.cssText = 'margin-bottom: 20px; padding: 12px 15px; border-radius: 8px; font-size: 13px; font-weight: 500;';
            
            if (type === 'error') {
                msgDiv.style.background = 'rgba(239, 68, 68, 0.15)';
                msgDiv.style.color = '#f87171';
                msgDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            } else {
                msgDiv.style.background = 'rgba(34, 197, 94, 0.15)';
                msgDiv.style.color = '#4ade80';
                msgDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            }

            // Insert before the form
            form.parentElement.insertBefore(msgDiv, form);

            // Auto-remove after 6 seconds
            setTimeout(() => msgDiv.remove(), 6000);
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

        // --- Reviews Section Load & Submit Handlers ---
        function loadReviews() {
            fetch("/api/reviews/?doctor_id=all")
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
                            const fullStars = Math.floor(review.rating);
                            const emptyStars = 5 - fullStars;
                            let revStars = "";
                            for (let i=0; i<fullStars; i++) revStars += '<i class="fa-solid fa-star"></i>';
                            for (let i=0; i<emptyStars; i++) revStars += '<i class="fa-regular fa-star"></i>';
                            
                            const revDate = new Date(review.created_at).toLocaleDateString("en-IN", {
                                day: 'numeric', month: 'long', year: 'numeric'
                            });
                            
                            let reviewImageHTML = '';
                            if (review.image) {
                                reviewImageHTML = `
                                    <div style="margin-top: 10px;">
                                        <img src="${review.image}" alt="Review image" style="max-width: 120px; max-height: 120px; border-radius: 4px; object-fit: cover; cursor: pointer;" onclick="window.open('${review.image}', '_blank')">
                                    </div>
                                `;
                            }

                            let repliesHTML = '';
                            if (review.replies && review.replies.length > 0) {
                                review.replies.forEach(reply => {
                                    const badge = reply.is_master_admin ? 
                                        '<span style="background: var(--secondary); color: black; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Master Admin</span>' :
                                        '<span style="background: var(--primary); color: white; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 5px;">Doctor Reply</span>';
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
                            if (isSuper || userRole === 'master_admin' || userRole === 'doctor') {
                                replyFormHTML = `
                                    <form onsubmit="submitReviewReply(event, ${review.id})" style="margin-left: 40px; margin-top: 12px; display: flex; gap: 10px;">
                                        <input type="text" placeholder="Write a public reply..." required style="flex: 1; background: var(--bg-body); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                                        <button type="submit" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Reply</button>
                                    </form>
                                `;
                            }

                            feed.innerHTML += `
                                <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 15px; width: 100%;">
                                    <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 8px;">
                                        <div style="width: 32px; height: 32px; border-radius:50%; background: var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600;">${review.username[0].toUpperCase()}</div>
                                        <strong style="font-size:15px; color:var(--text-main);">${review.username}</strong>
                                    </div>
                                    <div style="font-size:14px; color:#f59e0b; margin-bottom: 5px;">
                                        ${revStars} <strong style="color:var(--text-main); margin-left: 5px; font-size: 15px;">${review.title}</strong>
                                    </div>
                                    <div style="font-size:12px; color:var(--text-muted); margin-bottom: 8px;">Reviewed on ${revDate}</div>
                                    <p style="font-size:15px; color:var(--text-main); margin: 0 0 10px 0; line-height: 1.6; word-break: break-word; white-space: pre-wrap; max-width: 100%;">${review.comment}</p>
                                    ${reviewImageHTML}
                                    <div class="review-replies-container">
                                        ${repliesHTML}
                                    </div>
                                    ${replyFormHTML}
                                </div>
                            `;
                        });
                        if (feed.innerHTML === "") {
                            feed.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No feedback left yet. Be the first to share your experience!</p>`;
                        }
                    } else {
                        feed.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No feedback left yet. Be the first to share your experience!</p>`;
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

        window.submitReview = function(e) {
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
            const imgFile = document.getElementById("review-image").files[0];

            const formData = new FormData();
            formData.append("rating", rating);
            formData.append("title", title);
            formData.append("comment", comment);
            formData.append("service_type", "DOCTOR");
            if (imgFile) {
                formData.append("image", imgFile);
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
                starOptions.forEach(s => {
                    s.classList.remove("fa-solid");
                    s.classList.add("fa-regular");
                });
                showStatus("success", "Feedback submitted successfully!");
                loadReviews();
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
                loadReviews(); // Reload to render new replies
            })
            .catch(err => {
                alert(err.message);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        };

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

        // Load reviews initially
        loadReviews();
    });