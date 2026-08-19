# 🍔 CanteenQueue

### Smart Campus Canteen Pre-Ordering & Queue Management System

**CanteenQueue** is a full-stack campus canteen platform that enables students to pre-order food, reserve pickup slots, make cashless payments, and track orders in real time. It also provides canteen staff with streamlined kitchen and inventory operations and administrators with centralized management and analytics.

---

## 🚀 Features

### 👨‍🎓 Student

* Secure registration and JWT-based login
* Browse and filter available menu items
* Cart and quantity management
* Pickup-slot reservation with capacity control
* Group ordering with automated bill splitting
* Digital wallet for payments and refunds
* Real-time order tracking and notifications

### 👨‍🍳 Canteen Staff

* Live order board sorted by pickup time
* One-click order status updates
* Inventory CRUD operations
* Automatic out-of-stock handling
* Real-time synchronization with student orders

### 👑 Admin

* User, menu, pricing and pickup-slot management
* Centralized system configuration
* Sales and item-performance analytics
* Revenue and order trend reporting

---

## 🛠️ Tech Stack

| Category                | Technology          |
| ----------------------- | ------------------- |
| Frontend                | React.js            |
| Backend                 | Node.js, Express.js |
| Database                | MongoDB             |
| Authentication          | JWT                 |
| Real-Time Communication | Socket.IO           |
| API                     | REST                |
| Version Control         | Git, GitHub         |

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────┐
│              React Frontend               │
│  Student • Staff • Admin Dashboards      │
└───────────────────┬──────────────────────┘
                    │
              REST API / Socket.IO
                    │
┌───────────────────▼──────────────────────┐
│          Node.js + Express.js             │
│ Authentication • Orders • Wallet •        │
│ Inventory • Notifications • Analytics     │
└───────────────────┬──────────────────────┘
                    │
                    ▼
              ┌───────────┐
              │  MongoDB  │
              └───────────┘
```

---

## 🔄 Order Lifecycle

```text
Placed → Received → Preparing → Ready → Completed
```

Order status changes are propagated to the student interface through **Socket.IO**, eliminating the need for manual page refreshes.

---

## 🔐 Security

* JWT authentication
* Hashed passwords
* Role-based authorization
* Institutional email validation
* Protected API endpoints
* Server-side input validation

---

## 📂 Project Structure

```text
CanteenQueue/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── App.jsx
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── .env
├── .gitignore
└── README.md
```

---

## ⚙️ Setup

### 1. Clone

```bash
git clone https://github.com/your-username/CanteenQueue.git
cd CanteenQueue
```

### 2. Backend

```bash
cd server
npm install
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Environment Variables

Create `.env` in the backend:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## 🖥️ Screenshots

| Student Dashboard | Kitchen Dashboard |
| ----------------- | ----------------- |
| *Add screenshot*  | *Add screenshot*  |

| Menu & Cart      | Admin Analytics  |
| ---------------- | ---------------- |
| *Add screenshot* | *Add screenshot* |

---

## 🎯 Objectives

* Reduce physical canteen queues
* Prevent pickup-slot congestion
* Digitize order and kitchen workflows
* Improve inventory visibility
* Enable convenient cashless transactions
* Provide real-time operational visibility

---

## 🔮 Future Scope

* QR-based order pickup
* Online payment gateway integration
* Mobile application
* Multi-canteen support
* Loyalty and reward system
* Advanced demand and sales forecasting

---

## 👥 User Roles

```text
Student
  ├── Order Food
  ├── Manage Wallet
  ├── Join Group Orders
  └── Track Orders

Canteen Staff
  ├── Process Orders
  └── Manage Inventory

Admin
  ├── Manage System
  └── View Analytics
```

---

## ⭐ Project Highlights

**CanteenQueue brings ordering, pickup scheduling, real-time kitchen operations, digital payments, inventory control, and analytics together in one campus-focused platform.**

> **Skip the Queue, Not Your Meal.**
