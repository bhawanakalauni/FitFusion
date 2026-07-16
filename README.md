# 👟 FitFusion — Style. Comfort. Confidence.

FitFusion is a premium, state-of-the-art e-commerce platform built on the MERN stack. Designed with clean modern aesthetics and rich animations, it delivers a high-performance experience for shopping, inventory management, and verified community reviews.

---

## 🚀 Key Features

### 🛍 Storefront Experience
- **Rebranded Interface:** Styled with dynamic animations and premium visual styling.
- **Client-Side Stock Caps:** Real-time feedback on product pages; limits add-to-cart operations according to specific size stocks.
- **Grouped Orders:** Multiple items purchased together are grouped under a single order card, ensuring users view their orders as unified deliveries.
- **Verified Customer Reviews:** Ratings and written reviews can only be submitted by buyers once their order status is marked as `"Delivered"`.
- **Simplified Checkout:** Autopopulates address details from past orders. The full name and email are populated directly from secure credentials.

### 📊 Backend & Security
- **Size-Specific Inventory:** Products store stock counts mapped to individual sizes (`S`, `M`, `L`, `XL`, `XXL`).
- **Checkout Stock Validation:** Prior to payment gateway instantiation, the server validates size-specific stocks and rejects out-of-stock items, returning a structured list of available limits and triggering redirection with pulsing warning notices.
- **Payment Safety Gates:** Unpaid online transactions are automatically filtered out from user logs and admin order listings.
- **Email Normalization:** Enforces lowercased authentication credentials.
- **JWT Admin Security:** Admin tokens carry cryptographically signed payloads with robust expiration times.

### 🛡 Admin Control Panel
- **Batch Add/Edit Products:** Prompts and saves size-specific stock values via clean JSON structures.
- **Consolidated Orders View:** Tracks shipping processes cleanly, showing legacy order formatting and new unified names seamlessly.

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, Vanilla CSS (Flexbox & Grid architectures)
- **Admin Panel:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Payments:** Razorpay Integration

---

## 📂 Project Architecture

```
FitFusion/
├── backend/            # Express.js REST API server & database models
├── frontend/           # Storefront React SPA client
├── admin/              # Admin dashboard React SPA client
└── README.md           # Documentation
```

---

## 🚀 Quick Setup & Installation

### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file containing configuration variables:
   ```env
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   ADMIN_EMAIL=admin@fitfusion.com
   ADMIN_PASSWORD=your_admin_password
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
4. Start the server:
   ```bash
   npm run server
   ```

### 2. Storefront Client Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build or start the development environment:
   ```bash
   npm run dev
   ```

### 3. Admin Panel Setup
1. Navigate to the admin directory:
   ```bash
   cd ../admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: Environment variables for frontend/admin directories should be updated to point to the backend URL (`http://localhost:4000`).*
3. Start the dashboard:
   ```bash
   npm run dev
   ```

---

## 📜 License

Licensed under the [MIT License](LICENSE).
