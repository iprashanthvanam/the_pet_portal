
##  THE PET PORTAL 🐾
**The Pet Portal** is a full-stack **Django-based e-commerce web application** that combines:

- 🐶 Pet Adoption
- 🛒 Pet Food Online Sales  

into a single, real-world, production-style platform.

### 🌐 Live Application

**https://prashanthvanam.pythonanywhere.com**



The application simulates **industry-grade e-commerce workflows**, including:

- User authentication  
- Shopping cart & checkout  
- Online & offline payments  
- Order lifecycle management  
- Order tracking  
- Admin-controlled operations  
- Secure cloud deployment  

This project was developed as part of the  
**Edunet Foundation – NextGen Employability Program (Capstone Project)**.

---

### User Features

- User Registration & Login (Django Authentication)
- Browse pets available for adoption
- Browse premium pet food products
- Add pets and food items to cart
- Session-based cart persistence
- Secure checkout with:
  - **Cash on Delivery (COD)**
  - **Razorpay Online Payment**
- Real-time payment verification
- Order confirmation page
- Unique **UUID-based Order ID**
- Track order status using Order ID
- View complete order history
- Secure logout & session handling

---

### Admin Features

- Secure Django Admin Dashboard
- Manage pets and food products
- View all user orders
- Inline order item inspection
- Update order lifecycle:
  - CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- Mark orders as paid / unpaid
- Monitor Razorpay payment confirmations
- Centralized order management

---

### Tech Stack

**Backend:** Django 5.2 (Python) – Business logic & ORM  
**Database:** SQLite (Production Demo)  
**Frontend:** HTML, CSS, JavaScript  
**Payments:** Razorpay  
**Authentication:** Django Authentication  
**Sessions:** Django Sessions (Cart & Login Persistence)  
**Deployment:** PythonAnywhere  

---

### Installation & Setup (Local)


Clone the Repository

```bash
git clone https://github.com/your-username/the-pet-portal.git
cd the-pet-portal
```

Create & Activate Virtual Environment

```
python -m venv venv
```

Activate the virtual environment

Linux / macOS
```
source venv/bin/activate
```

Windows
```
venv\Scripts\activate
```

Install Dependencies

```
pip install -r requirements.txt
```


Database Setup
```

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```


Run Development Server

```
python manage.py runserver
```

Open your browser
```
http://127.0.0.1:8000
```



---
### Application workflow

#### Browsing & Cart

 - User logs in
 - Browses pets and pet food
 - Adds items to cart
 - Cart stored securely using Django sessions


 #### Checkout
 ✅ Cash on Delivery (COD)
 - Order placed instantly
 - Payment Status: UNPAID
 - Order Status: CONFIRMED

 💰 Razorpay Online Payment
 - Razorpay payment window opens
 - User completes payment
 - Payment verified in real-time
 - Order updated as:
     paid = True
     status = CONFIRMED
 - Order success page displayed

 #### Order status

- paid = True
- status = CONFIRMED
- Order success page displayed

 #### Order Tracking

 - Each order generates a UUID-based Order ID
 - Users can track orders via:
   - Track Order Page
   - Order ID input
 - Displays:
   - Customer name
   - Order total
   - Current order status

 #### Admin Dashboard Capabilities

 - View all orders
 - Inspect order items inline
 - Filter orders by:
   - Status
   - Payment state
   - Date
 - Update order status
 - Monitor paid / unpaid orders
 - Manage pets & food inventory

#### Order updated
- Order status = CANCELLED
- payment_status = REFUNDED
- Refund Reference Number (RRN) stored
- Amount credited back to user

####  Refund Flow (Razorpay)
- User/Admin cancels paid order
- Refund triggered via Razorpay API


####  Refund Time
- Usually 5–7 working days (bank dependent)

####  Invoice Generation
PDF invoices generated using ReportLab
Includes:
- Customer details
- Ordered items
- Payment method & status
- Total amount

#### Downloadable by
- User
- Admin

####  Webhooks
- Razorpay Events Used
- payment.captured
- Purpose:
- Sync payment status even if user closes browser
- Prevent payment inconsistencies
- Ensure idempotent payment handling

####  Security Measures:
- CSRF protection
- Razorpay webhook signature verification
- Role-based access (User / Admin)
- Secure invoice access
- Safe refund & payment verification
- Django authentication best practices

---

### LIVE DEPLOYMENT – PYTHONANYWHERE


The application is fully deployed on PythonAnywhere.
 - Uploaded Django project files
 - Configured WSGI file
 - Enabled virtual environment
 - Configured static & media files
 - Applied database migrations
 - Enabled HTTPS
 - Verified Razorpay payment callbacks


<h3 align="center">Landing Page</h3>

<p align="center">
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232823.png" width="60%" />
 
</p>


<h3 align="center">User Registration & Login</h3>

<p align="center">
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232844.png" width="45%" />
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232909.png" width="45%" />
 
</p>


<h3 align="center">Pets Listing & Cart</h3>

<p align="center">
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232928.png" width="45%" />
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232944.png" width="45%" />
 
</p>


<h3 align="center">Checkout & Payment</h3>

<p align="center">
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20232959.png" width="45%" />
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233022.png" width="45%" />
  
</p>


<h3 align="center">Order Success</h3>

<p align="center">
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233125.png" width="60%" />
 
</p>


<h3 align="center">Order Tracking & History</h3>

<p align="center">
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233149.png" width="45%" />
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233205.png" width="45%" />
 
</p>


<h3 align="center">Invoice & Contact</h3>

<p align="center">
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233251.png" width="45%" />
   <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233329.png" width="45%" />

  
</p>


<h3 align="center">Admin Dashboard</h3>
<p align="center">
  <img src="https://raw.githubusercontent.com/iprashanthvanam/the_pet_portal/main/images/Screenshot%202026-02-08%20233309.png" width="60%" />

</p>
