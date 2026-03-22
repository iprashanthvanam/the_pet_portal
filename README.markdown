<a id="readme-top"></a>

<!-- BADGES -->
[![GitHub Stars](https://img.shields.io/github/stars/iprashanthvanam/the_pet_portal?style=for-the-badge&color=f59e0b)](https://github.com/iprashanthvanam/the_pet_portal/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/iprashanthvanam/the_pet_portal?style=for-the-badge&color=3b82f6)](https://github.com/iprashanthvanam/the_pet_portal/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/iprashanthvanam/the_pet_portal?style=for-the-badge&color=ef4444)](https://github.com/iprashanthvanam/the_pet_portal/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Chatbot-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Deployed on PythonAnywhere](https://img.shields.io/badge/Deployed%20on-PythonAnywhere-1f8dd6?style=for-the-badge&logo=python&logoColor=white)](https://prashanthvanam.pythonanywhere.com)

---

<div align="center">

# The Pet Portal 🐾
### A Full-Stack Pet Marketplace & Service Management System

*Adopt pets, shop for supplies, book vet appointments, grooming and boarding services — all in one production-grade Django platform with Razorpay payments and a Gemini AI chatbot.*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-46E3B7?style=for-the-badge)](https://prashanthvanam.pythonanywhere.com)
[![Report Bug](https://img.shields.io/badge/🐛%20Report%20Bug-Open%20Issue-ef4444?style=for-the-badge)](https://github.com/iprashanthvanam/the_pet_portal/issues/new?labels=bug)
[![Request Feature](https://img.shields.io/badge/✨%20Request%20Feature-Open%20Issue-8b5cf6?style=for-the-badge)](https://github.com/iprashanthvanam/the_pet_portal/issues/new?labels=enhancement)

<br/>

<!-- HERO SCREENSHOT -->
<img src="Images/home.png" alt="The Pet Portal — Home Page" width="900"/>

> **The Pet Portal** — A complete pet marketplace covering adoption, shopping, services, payments, and AI assistance

</div>

---

<!-- TABLE OF CONTENTS -->
<details>
  <summary>📑 Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#screenshots">Screenshots</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#system-architecture">System Architecture</a></li>
    <li><a href="#application-workflow">Application Workflow</a></li>
    <li><a href="#database-models">Database Models</a></li>
    <li><a href="#payment-integration">Payment Integration (Razorpay)</a></li>
    <li><a href="#ai-chatbot">AI Chatbot (Gemini)</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#security">Security</a></li>
    <li><a href="#deployment">Deployment (PythonAnywhere)</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---

## About The Project

Most pet owners juggle multiple platforms — one for adoption, another for food delivery, a third for vet bookings, and another for grooming. There's no single, integrated place to manage everything about a pet.

**The Pet Portal** is a production-grade, full-stack Django web application that solves this. It brings together pet adoption listings, a food and accessories marketplace, doctor consultation booking, grooming appointments, boarding services, real-time Razorpay payments, PDF invoicing, order tracking, and a Gemini AI-powered chatbot — all in one place.

**Why The Pet Portal?**

- ❌ **Old approach:** Fragmented services across multiple apps and websites
- ✅ **Our approach:** A single Django platform covering the entire pet ownership journey — from adoption to aftercare
- 🎯 **Outcome:** A real-world, production-deployed application with industry-grade payment flows, order lifecycle management, and AI-assisted pet advice

> This project was developed as part of the **Edunet Foundation – NextGen Employability Program (Capstone Project)**.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Screenshots

> **📸 Image folder guide** — see [which screenshots to take and how to name them](#-which-screenshots-to-take--naming-guide) at the bottom of this section.

A complete visual walkthrough of every screen in The Pet Portal.

---

### 🏠 Home Page

<div align="center">
  <img src="Images/home.png" alt="The Pet Portal — Home Page" width="860"/>
  <br/><br/>
  <sub><b>Landing page.</b> Hero banner, featured pets, food categories, and service highlights — built with responsive HTML/CSS and Google Fonts (Poppins).</sub>
</div>

---

### 🔐 Register & Login

<div align="center">
  <img src="Images/register.png" alt="User Registration" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/login.png" alt="User Login" width="420"/>
  <br/><br/>
  <sub><b>User authentication.</b> Django's built-in auth system extended with <code>django-allauth</code> for social login. Cart data persists across login via session merge.</sub>
</div>

---

### 🐾 Pet Listing & Pet Detail

<div align="center">
  <img src="Images/pets_listing.png" alt="Pet Listing Page" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/pet_detail.png" alt="Pet Detail Page" width="420"/>
  <br/><br/>
  <sub><b>Pet marketplace.</b> Browse available pets with live search, species filter, and price range. Each pet page shows the full health profile — vaccination status, weight, microchip ID, temperament, and adoption readiness.</sub>
</div>

---

### 🛒 Cart & Checkout

<div align="center">
  <img src="Images/cart.png" alt="Shopping Cart" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/checkout.png" alt="Checkout Page" width="420"/>
  <br/><br/>
  <sub><b>Cart and checkout flow.</b> Session-based cart supports pets, food, and accessories together. Checkout accepts <b>Cash on Delivery</b> and <b>Razorpay online payment</b> with real-time server-side verification.</sub>
</div>

---

### 💳 Razorpay Payment & Order Success

<div align="center">
  <img src="Images/razorpay_payment.png" alt="Razorpay Payment Modal" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/order_success.png" alt="Order Success Page" width="420"/>
  <br/><br/>
  <sub><b>Payment integration.</b> Razorpay checkout modal opens in-browser. Payment is verified server-side via HMAC-SHA256 signature validation. On success, the order is marked PAID and the confirmation page is shown.</sub>
</div>

---

### 📦 Order History & Order Tracking

<div align="center">
  <img src="Images/order_history.png" alt="Order History" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/track_order.png" alt="Track Order" width="420"/>
  <br/><br/>
  <sub><b>Order management.</b> Full history with status badges (CONFIRMED → PROCESSING → SHIPPED → DELIVERED). Track any order using its UUID-based Order ID — no login required.</sub>
</div>

---

### 🧾 Invoice Download

<div align="center">
  <img src="Images/invoice.png" alt="PDF Invoice" width="860"/>
  <br/><br/>
  <sub><b>PDF invoice generation.</b> WeasyPrint generates a formatted PDF invoice per order — includes customer details, itemised list, payment method, payment status, and total. Downloadable by both user and admin.</sub>
</div>

---

### 🩺 Consult a Doctor & Appointment History

<div align="center">
  <img src="Images/consult_doctor.png" alt="Consult Doctor Booking" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/appointment_history.png" alt="Appointment History" width="420"/>
  <br/><br/>
  <sub><b>Veterinary consultation booking.</b> Book a vet appointment with pet details, symptoms, preferred date/time, and contact info. View and cancel upcoming appointments from the history page.</sub>
</div>

---

### ✂️ Grooming Booking & History

<div align="center">
  <img src="Images/grooming_booking.png" alt="Grooming Booking Form" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/grooming_history.png" alt="Grooming History" width="420"/>
  <br/><br/>
  <sub><b>Pet grooming services.</b> Choose from 6 packages — Basic Bath, Haircut & Styling, Nail Clipping, Ear Cleaning, Tick Treatment, or Full Package. Price auto-calculated by pet size (Small/Medium/Large) and visit type (Center/Home ₹300 extra).</sub>
</div>

---

### 🏡 Pet Care / Boarding & History

<div align="center">
  <img src="Images/pet_care_booking.png" alt="Pet Care Boarding Form" width="420"/>
  &nbsp;&nbsp;
  <img src="Images/pet_care_history.png" alt="Pet Care History" width="420"/>
  <br/><br/>
  <sub><b>Pet boarding / day care.</b> Book overnight or multi-day care with optional add-ons — special diet (+₹250), injections (+₹200), vaccinations (+₹300), extra care (+₹400). Total price is calculated automatically on save.</sub>
</div>

---

### 👤 User Profile

<div align="center">
  <img src="Images/profile.png" alt="User Profile Page" width="860"/>
  <br/><br/>
  <sub><b>Profile management.</b> Update profile image, phone number, address, and city. Profile is auto-created on registration via Django signals.</sub>
</div>

---

### 🤖 AI Chatbot (Gemini)

<div align="center">
  <img src="Images/ai_chatbot.png" alt="Gemini AI Chatbot" width="860"/>
  <br/><br/>
  <sub><b>Gemini-powered pet assistant.</b> Embedded AI chatbot built with Google's <code>google-genai</code> SDK. Answers pet care questions, product queries, and service information in real time without page reload.</sub>
</div>

---

### 🛠️ Admin AI Dashboard

<div align="center">
  <img src="Images/admin_ai_dashboard.png" alt="Admin AI Dashboard" width="860"/>
  <br/><br/>
  <sub><b>Admin-only AI analytics dashboard.</b> A Gemini-powered internal dashboard for admins to query platform data, order trends, and get AI-assisted insights.</sub>
</div>

---

### 🎛️ Django Admin Panel

<div align="center">
  <img src="Images/django_admin.png" alt="Django Admin Dashboard" width="860"/>
  <br/><br/>
  <sub><b>Full admin control.</b> Manage pets, food, orders (with inline items), appointments, grooming bookings, pet care bookings, accessories, and users. Styled with <code>django-jazzmin</code> and <code>django-unfold</code>.</sub>
</div>

---

### 📸 Which Screenshots to Take — Naming Guide

Create an `Images/` folder in the root of your repository and take the following screenshots. Name each file **exactly** as shown below so the README renders correctly:

| File Name | Page / URL | What to Show |
|-----------|-----------|--------------|
| `home.png` | `/` | Full landing page with banner and featured sections |
| `register.png` | `/register/` | Registration form |
| `login.png` | `/login/` | Login form |
| `pets_listing.png` | `/pets/` | Pet listing grid with search bar |
| `pet_detail.png` | `/pet/<id>/` | Single pet page with health profile |
| `cart.png` | `/cart/` | Cart with items added |
| `checkout.png` | `/checkout/` | Checkout form with payment options |
| `razorpay_payment.png` | `/checkout/` | Razorpay modal open (browser screenshot) |
| `order_success.png` | `/order/success/<id>/` | Order confirmed page |
| `order_history.png` | `/orders/` | List of user orders with status badges |
| `track_order.png` | `/track/` | Order tracking result with timeline |
| `invoice.png` | `/order/invoice/<id>/` | PDF invoice rendered in browser |
| `consult_doctor.png` | `/consult/` | Vet booking form |
| `appointment_history.png` | `/appointments/` | Appointment history list |
| `grooming_booking.png` | `/grooming/` | Grooming booking form with package selector |
| `grooming_history.png` | `/grooming/history/` | Grooming booking history |
| `pet_care_booking.png` | `/pet-care/` | Pet boarding form with add-ons |
| `pet_care_history.png` | `/pet-care/history/` | Boarding booking history |
| `profile.png` | `/profile/` | User profile edit page |
| `ai_chatbot.png` | Any page | AI chatbot panel open with a conversation |
| `admin_ai_dashboard.png` | `/admin-ai-dashboard/` | Admin AI analytics page |
| `django_admin.png` | `/admin/` | Django admin home (jazzmin/unfold styled) |

> **Tip:** Use full-page screenshots at 1440px wide for the best quality. Tools like [GoFullPage](https://chrome.google.com/webstore/detail/gofullpage/fdpohaocaechugugjohnnlfkgccgceka) (Chrome extension) capture entire pages in one click.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Key Features

### 🐾 Marketplace
- **Pet Adoption Listings** — Browse with live search, species filter, and price range
- **Pet Health Profiles** — Vaccination, dewormed, neutered, microchip ID, vet contact, diet, temperament, and adoption readiness — linked one-to-one per pet
- **Pet Food Shop** — Browse by food type, view MFG and expiry dates
- **Pet Accessories** — Toys, beds, leashes, collars, clothing, supplements — filterable by category, pet type, size, and colour with stock tracking
- **Detailed Product Pages** — Full detail view for pets, food, and accessories

### 🛒 E-commerce Engine
- **Session-based cart** — Persists across login/logout; guest cart merges on login via Django signals
- **Multi-type cart** — Supports pets, food, and accessories together in one cart
- **Ajax cart updates** — Quantity changes without page reload
- **Cash on Delivery (COD)** — Instant order placement, payment collected on delivery
- **Razorpay Online Payment** — In-browser checkout modal with server-side signature verification
- **Razorpay Webhooks** — `payment.captured` event syncs payment state even if user closes browser
- **Retry Payment** — Users can re-attempt failed Razorpay payments from order history
- **Order Cancellation + Auto-Refund** — Triggers Razorpay refund, stores RRN, marks order CANCELLED + REFUNDED
- **PDF Invoices** — Generated with WeasyPrint, downloadable by user and admin

### 📦 Order Management
- **UUID-based Order IDs** — Collision-proof unique identifiers per order
- **Full lifecycle tracking** — CONFIRMED → PROCESSING → SHIPPED → DELIVERED with timestamps per stage
- **Public order tracking** — Track any order by Order ID without logging in
- **Order history** — Complete history with payment status and invoice download

### 🩺 Services
- **Vet Consultation Booking** — Book appointments with pet details, symptoms, preferred date/time
- **Pet Grooming Booking** — 6 packages with auto-pricing by pet size and center/home visit type
- **Pet Boarding / Day Care** — Multi-day booking with 4 optional add-ons and auto price calculation
- **Service History & Cancellation** — View and cancel all bookings from dedicated history pages

### 🤖 AI Features
- **Gemini AI Chatbot** — Real-time pet care assistant via `POST /api/chatbot/`
- **Admin AI Dashboard** — Gemini-powered analytics for admins at `/admin-ai-dashboard/`

### 👤 User Management
- **Django Authentication** — Registration, login, logout, session management
- **Social Login** — `django-allauth` integration
- **User Profile** — Profile image, phone, address, city — auto-created via Django signals
- **Role-based access** — User vs Admin enforced at view level

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 5.2 (Python 3.11+) |
| **Database** | SQLite (dev / PythonAnywhere demo) |
| **Frontend** | HTML5, CSS3, JavaScript (Poppins, Font Awesome 6) |
| **Payments** | Razorpay (order create, verify, webhooks, refunds) |
| **AI** | Google Gemini (`google-genai` SDK) |
| **PDF Generation** | WeasyPrint + ReportLab |
| **Authentication** | Django Auth + django-allauth (social login) |
| **Admin UI** | django-jazzmin + django-unfold |
| **REST API** | Django REST Framework |
| **Sessions** | Django Sessions (cart + login persistence) |
| **Deployment** | PythonAnywhere |
| **Media** | Pillow (image processing) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## System Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML / CSS / JS)                     │
│                                                                   │
│  Home │ Pets │ Food │ Accessories │ Cart │ Checkout │ Profile     │
│  Consult │ Grooming │ Pet Care │ Track Order │ AI Chatbot         │
└────────────────────────┬──────────────────────────────────────────┘
                         │  HTTP (Django Sessions + CSRF)
┌────────────────────────▼─────────────────────────────────────────┐
│                  DJANGO BACKEND (views.py — 40+ views)           │
│                                                                  │
│  Auth Layer          │  Cart Engine         │  Order Engine      │
│  (Django Auth +      │  (Session + DB,      │  (UUID Orders,     │
│   allauth)           │   merge on login)    │  lifecycle, times) │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                 PAYMENT ENGINE (Razorpay)                │    │
│  │  Create Order → JS Modal → Verify Signature              │    │
│  │  Mark Paid → Webhook Sync → Refund Flow                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              SERVICE BOOKING ENGINE                      │    │
│  │  Vet Appointments │ Grooming │ Pet Care / Boarding       │    │
│  │  Auto-pricing │ Status Lifecycle │ Cancellation          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                      AI LAYER                            │    │
│  │  Gemini Chatbot (/api/chatbot/) │ Admin AI Dashboard     │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────────┘
                         │  Django ORM
┌────────────────────────▼─────────────────────────────────────────┐
│                      DATABASE (SQLite)                           │
│  Pet │ PetHealthProfile │ Food │ Accessory │ products            │
│  Order │ OrderItem │ CartItem │ UserProfile                      │
│  DoctorAppointment │ PetCareBooking │ GroomingBooking            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│            WeasyPrint / ReportLab — Invoice Generation           │
└──────────────────────────────────────────────────────────────────┘
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Application Workflow

### 🛒 Shopping & Checkout

```
User Login → Browse Pets / Food / Accessories
    → Add to Cart (session-based, merges on login via signal)
    → Cart Detail (Ajax quantity update, remove items)
    → Checkout Form (name, address, payment method)
         ├── COD      → Order created (CONFIRMED, UNPAID)
         │              → Order Success Page
         └── Razorpay → razorpay.order.create() server-side
                         → JS Checkout Modal in browser
                         → User completes payment
                         → POST /payment/verify/ (HMAC-SHA256 check)
                         → Order marked PAID + CONFIRMED
                         → Order Success Page
```

### 📦 Order Lifecycle

```
CONFIRMED ──→ PROCESSING ──→ SHIPPED ──→ DELIVERED
    │                                       (each stage
    └──→ CANCELLED                           timestamped)
          └── Paid order → Razorpay Refund
               → payment_status = REFUNDED
               → razorpay_refund_id (RRN) stored
```

### 🩺 Service Booking Flow

```
User selects service → Fills booking form
    → Auto-pricing calculated in model.save()
    → Booking saved (status: PENDING)
    → Admin approves → Status updates
    → User views history page
    → Can cancel if needed
```

### 🤖 AI Chatbot Flow

```
User opens chatbot panel → Types question
    → POST /api/chatbot/
    → Django calls Gemini API (google-genai SDK)
    → Response returned → Rendered in chat UI
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Database Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `Pet` | name, species, price, image | Pet adoption listings |
| `PetHealthProfile` | vaccinated, weight_kg, microchip_id, vet_name, diet_type, temperament, adoption_ready | One-to-one health record per pet |
| `Food` | name, food_type, price, mfg_date, expire_date | Pet food products |
| `Accessory` | name, category, pet_type, price, brand, stock, size, color, rating | Toys, beds, leashes, collars, supplements |
| `products` | name, description, price, image | Generic product (REST API) |
| `CartItem` | user, item_type, item_id, name, price, quantity | Per-user cart — unique on (user, item_type, item_id) |
| `Order` | order_id (UUID), status, payment_method, payment_status, razorpay IDs, lifecycle timestamps | Full order record |
| `OrderItem` | order, product_name, price, quantity | Line items per order |
| `UserProfile` | user (1-to-1), profile_image, phone, address | Extended user profile, auto-created via signal |
| `DoctorAppointment` | pet_name, symptoms, appointment_date/time, status | Vet consultation bookings |
| `PetCareBooking` | start/end datetime, add-ons, total_days, total_price, status | Boarding bookings with auto-pricing |
| `GroomingBooking` | package_type, pet_size, visit_type, appointment_datetime, total_price, status | Grooming bookings with auto-pricing |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Payment Integration (Razorpay)

The Pet Portal implements a production-grade Razorpay integration covering the full payment lifecycle:

### Payment Flow

```
1. POST /checkout/
   └─ Server calls razorpay.order.create() → razorpay_order_id
   └─ Checkout page rendered with key + order ID in JS

2. Razorpay JS SDK opens checkout modal in browser
   └─ User enters card / UPI / netbanking details

3. POST /payment/verify/
   └─ Server receives razorpay_payment_id + signature
   └─ Verifies HMAC-SHA256 signature (prevents tampered payloads)
   └─ Calls order.mark_paid(payment_id)
   └─ Redirects to /order/success/<uuid>/

4. POST /payment/webhook/
   └─ Handles payment.captured event from Razorpay
   └─ Idempotent handler — safe if received multiple times
   └─ Syncs payment state if user closed browser before step 3

5. POST /order/cancel/<uuid>/
   └─ Checks order.can_cancel() (CONFIRMED or PROCESSING only)
   └─ Triggers razorpay.payment.refund() for paid orders
   └─ Stores razorpay_refund_id (RRN)
   └─ Marks order CANCELLED + REFUNDED
```

### Key Safeguards
- Server-side HMAC-SHA256 signature verification on every payment
- Idempotent webhook handler — duplicate events don't double-credit
- Retry payment endpoint for failed transactions
- Refund only allowed on CONFIRMED or PROCESSING orders

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## AI Chatbot (Gemini)

The Pet Portal includes a **Gemini-powered AI chatbot** built using Google's official `google-genai` Python SDK.

- **Endpoint:** `POST /api/chatbot/`
- **Model:** Google Gemini (configured via `GEMINI_API_KEY`)
- **Scope:** Pet care advice, product queries, service information
- **UI:** Embedded chat panel — no page reload required

An additional **Admin AI Dashboard** at `/admin-ai-dashboard/` gives admins a Gemini-powered interface to query platform data and get AI-assisted analytics.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Getting Started

### Prerequisites

- **Python** ≥ 3.11
- **pip**
- A **Razorpay** account (test mode keys work fine locally)
- A **Google Gemini API** key

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/iprashanthvanam/the_pet_portal.git
cd the_pet_portal
```

**2. Create and activate a virtual environment**

```bash
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)
```

**5. Apply database migrations**

```bash
python manage.py makemigrations
python manage.py migrate
```

**6. Create a superuser (admin)**

```bash
python manage.py createsuperuser
```

**7. Run the development server**

```bash
python manage.py runserver
```

Open your browser at `http://127.0.0.1:8000`

Django admin is at `http://127.0.0.1:8000/admin/`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Environment Variables

Create a `.env` file in the project root (same directory as `manage.py`):

```env
# ─── Django Core ───────────────────────────────────────────────
SECRET_KEY=your-very-long-random-django-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# ─── Razorpay ──────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret-key

# ─── Google Gemini AI ──────────────────────────────────────────
GEMINI_API_KEY=your-gemini-api-key

# ─── Email (optional — for contact form) ───────────────────────
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

> **Getting API keys:**
> - Razorpay: [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys → Generate Test Key
> - Gemini: [aistudio.google.com](https://aistudio.google.com) → Get API Key

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Project Structure

```
the_pet_portal/
├── Images/                             # 📸 README screenshots (22 images — see guide above)
│
├── myapp/
│   ├── migrations/                     # 10 database migrations
│   ├── static/
│   │   ├── css/                        # Page-specific stylesheets (cart, checkout, home, etc.)
│   │   ├── images/                     # Static assets (banners, logos)
│   │   └── javascript/                 # Client-side scripts (login.js, pets.js, register.js)
│   ├── templates/myapp/                # 25+ Django HTML templates
│   │   ├── home.html
│   │   ├── pets.html / pet_detail.html
│   │   ├── cart.html / checkout.html
│   │   ├── order_history.html / track_order.html
│   │   ├── consult_doctor.html / appointment_history.html
│   │   ├── grooming_form.html / grooming_history.html
│   │   ├── pet_care_form.html / pet_care_history.html
│   │   ├── profile.html / invoice.html
│   │   ├── admin_ai_dashboard.html
│   │   └── ... (25 total)
│   ├── templatetags/
│   │   ├── cart_extras.py              # Cart total calculation filters
│   │   └── custom_filters.py          # Custom template filters
│   ├── admin.py                        # All model admin registrations (jazzmin/unfold)
│   ├── apps.py                         # AppConfig + signals ready()
│   ├── forms.py                        # OrderCreateForm
│   ├── models.py                       # All 12 database models
│   ├── serializers.py                  # DRF serializers
│   ├── signals.py                      # UserProfile auto-create + cart merge on login
│   └── views.py                        # All 40+ view functions
│
├── myproject/
│   ├── settings.py                     # Django settings
│   ├── urls.py                         # All 40+ URL patterns
│   ├── wsgi.py
│   └── asgi.py
│
├── manage.py
├── requirements.txt
└── README.markdown
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Security

| Security Layer | Implementation |
|----------------|----------------|
| **CSRF Protection** | Django's `{% csrf_token %}` on all POST forms |
| **Authentication** | Django session auth; `@login_required` on all protected views |
| **Role-based Access** | Admin-only views check `request.user.is_staff` |
| **Razorpay Signature Verification** | HMAC-SHA256 server-side check on every payment |
| **Webhook Validation** | Razorpay webhook signature verified before processing |
| **Idempotent Payments** | `mark_paid()` checks existing payment status before updating |
| **Safe Refund Handling** | Refund only triggered if `can_cancel()` returns True |
| **Invoice Access Control** | Invoices accessible only to the order owner or admin |
| **Cart Session Security** | Cart merge on login prevents session fixation leaks |
| **Input Validation** | Django forms + model `clean()` methods on all user input |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Deployment (PythonAnywhere)

The Pet Portal is live at **[https://prashanthvanam.pythonanywhere.com](https://prashanthvanam.pythonanywhere.com)**

### Deployment Steps

**1. Upload project to PythonAnywhere**

```bash
# In PythonAnywhere console
git clone https://github.com/iprashanthvanam/the_pet_portal.git
cd the_pet_portal
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**2. Configure the WSGI file**

Edit `/var/www/yourusername_pythonanywhere_com_wsgi.py`:
```python
import os, sys
path = '/home/yourusername/the_pet_portal'
if path not in sys.path:
    sys.path.append(path)
os.environ['DJANGO_SETTINGS_MODULE'] = 'myproject.settings'
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**3. Configure Static and Media files** (Web tab → Static files section)

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/yourusername/the_pet_portal/staticfiles/` |
| `/media/` | `/home/yourusername/the_pet_portal/media/` |

**4. Finalise**

```bash
python manage.py collectstatic
python manage.py migrate
```

Set `DEBUG=False` and add your PythonAnywhere domain to `ALLOWED_HOSTS` in `settings.py`. Reload the web app from the PythonAnywhere Web tab.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Roadmap

- [x] User registration, login, logout
- [x] Pet adoption listings with full health profiles
- [x] Pet food & accessories marketplace
- [x] Session-based cart with Ajax updates
- [x] Razorpay payment (COD + online)
- [x] Razorpay webhook + refund flow with RRN storage
- [x] UUID-based order tracking
- [x] Full order lifecycle with timestamps
- [x] PDF invoice generation (WeasyPrint)
- [x] Vet consultation booking
- [x] Pet grooming booking with auto-pricing
- [x] Pet boarding / day care with add-on pricing
- [x] User profile with profile image
- [x] Gemini AI chatbot
- [x] Admin AI analytics dashboard
- [x] PythonAnywhere deployment
- [ ] Email / WhatsApp notifications for order and booking status changes
- [ ] Pet owner reviews and ratings on pets and services
- [ ] Admin inventory management with low-stock alerts
- [ ] Subscription plans for grooming / boarding
- [ ] Multi-vendor support for pet shops
- [ ] Mobile app (React Native / Flutter)
- [ ] Docker Compose for one-command local setup

See the [open issues](https://github.com/iprashanthvanam/the_pet_portal/issues) for the full list of proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contributing

Contributions are what make open-source great. Any contributions are **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please follow Django best practices, keep views thin with logic in models/services, and include comments for any new functionality. For significant changes, open an issue first to discuss the approach.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contact

<div align="center">

### Prashanth Vanam

<p>
  <a href="mailto:prashanthvanamnetha@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-prashanthvanamnetha%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white"/>
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/iprashanthvanam/">
    <img src="https://img.shields.io/badge/LinkedIn-iprashanthvanam-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"/>
  </a>
  &nbsp;
  <a href="https://github.com/iprashanthvanam">
    <img src="https://img.shields.io/badge/GitHub-iprashanthvanam-181717?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/📍%20Location-Hyderabad%2C%20India-f59e0b?style=for-the-badge"/>
  &nbsp;
  <img src="https://img.shields.io/badge/📞%20Mobile-%2B91%2070361%2042499-25D366?style=for-the-badge"/>
</p>

</div>

<br/>

| | |
|---|---|
| 📧 **Email** | [prashanthvanamnetha@gmail.com](mailto:prashanthvanamnetha@gmail.com) |
| 💼 **LinkedIn** | [linkedin.com/in/iprashanthvanam](https://www.linkedin.com/in/iprashanthvanam/) |
| 🐙 **GitHub** | [github.com/iprashanthvanam](https://github.com/iprashanthvanam) |
| 📍 **Location** | Hyderabad, Telangana, India |
| 📞 **Mobile** | +91 703 6142 499 |

<br/>

> 💬 Feel free to reach out for collaborations, questions, or just to say hi!

**Project Link:** [https://github.com/iprashanthvanam/the_pet_portal](https://github.com/iprashanthvanam/the_pet_portal)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Acknowledgments

- [Django](https://djangoproject.com/) — the web framework that powers everything
- [Razorpay](https://razorpay.com/) — payment gateway for COD and online payments
- [Google Gemini](https://ai.google.dev/) — AI chatbot and admin analytics
- [WeasyPrint](https://weasyprint.org/) — HTML-to-PDF invoice generation
- [django-allauth](https://django-allauth.readthedocs.io/) — social authentication
- [django-jazzmin](https://django-jazzmin.readthedocs.io/) — modern Django admin skin
- [django-unfold](https://unfoldadmin.com/) — enhanced admin panel components
- [Django REST Framework](https://www.django-rest-framework.org/) — REST API layer
- [Pillow](https://pillow.readthedocs.io/) — image processing for pet and profile photos
- [Font Awesome](https://fontawesome.com/) — icons throughout the UI
- [Google Fonts — Poppins](https://fonts.google.com/specimen/Poppins) — primary typeface
- [Edunet Foundation](https://edunetfoundation.org/) — NextGen Employability Program under which this capstone was built

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<div align="center">

Built with ❤️ for pet lovers everywhere 🐾

⭐ Star this repo if The Pet Portal inspired you!

</div>
