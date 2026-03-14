# 📦 Stockify — Inventory Management System

> A modular, real-time Inventory Management System that replaces manual registers and Excel sheets with a centralized web application. Built for the **Odoo × Indus Hackathon**.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STOCKIFY SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────┐          ┌──────────────────────────┐   │
│   │   FRONTEND       │          │       BACKEND            │   │
│   │   Next.js 14     │  Axios   │   Node.js + Express      │   │
│   │   Tailwind CSS   │ ──────►  │   REST API /api/v1/*     │   │
│   │   Pages Router   │ ◄──────  │   JWT + RBAC Auth        │   │
│   └──────────────────┘  JSON   │   Zod Validation         │   │
│                                 │   Swagger UI /api-docs   │   │
│                                 └────────────┬─────────────┘   │
│                                              │ Sequelize ORM    │
│                                              ▼                  │
│                                 ┌──────────────────────────┐   │
│                                 │       DATABASE           │   │
│                                 │   MySQL (Local)          │   │
│                                 │   15 Tables              │   │
│                                 │   Migrations + Seeders   │   │
│                                 └──────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                     API REQUEST FLOW
     ┌────────┐    ┌───────────┐    ┌────────────┐    ┌──────┐
     │ Client │───►│ JWT Auth  │───►│ RBAC Check │───►│ Zod  │
     └────────┘    │Middleware │    │ Middleware  │    │Valid.│
                   └───────────┘    └────────────┘    └──┬───┘
                                                         │
                   ┌───────────┐    ┌────────────┐    ┌──▼───┐
                   │  MySQL DB │◄───│  Sequelize │◄───│ Ctrl │
                   │           │    │    ORM     │    │ + Svc│
                   └───────────┘    └────────────┘    └──────┘

                     DATABASE SCHEMA (Key Tables)
     ┌──────────┐    ┌──────────┐    ┌──────────────┐
     │  users   │    │ products │    │  inventory   │
     │──────────│    │──────────│    │──────────────│
     │ id (PK)  │    │ id (PK)  │    │ product_id   │
     │ name     │    │ name     │    │ location_id  │
     │ email    │    │ sku      │    │ qty_on_hand  │
     │ role     │    │ category │    └──────────────┘
     │ is_active│    │ reorder  │
     └──────────┘    └──────────┘
          │
          │ created_by FK
          ▼
     ┌──────────┐    ┌──────────┐    ┌──────────────┐
     │ receipts │    │deliveries│    │  transfers   │
     └──────────┘    └──────────┘    └──────────────┘
          │               │                │
          └───────────────┴────────────────┘
                          │ All log to
                          ▼
                   ┌─────────────┐
                   │ stock_moves │  ← Audit trail for every
                   │  (ledger)   │    stock change
                   └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (Pages Router) | Server-side capable React framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **HTTP Client** | Axios | API calls with JWT interceptor |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MySQL (Local) | Relational data storage |
| **ORM** | Sequelize | Models, migrations, seeders |
| **Auth** | JWT (jsonwebtoken) | Stateless authentication |
| **Access Control** | Custom RBAC Middleware | Role-based route protection |
| **Validation** | Zod | Request body validation |
| **API Docs** | Swagger UI (swagger-jsdoc) | Live interactive API explorer |
| **Password** | bcryptjs | Secure password hashing |

---

## ✨ Features

### 🔐 Authentication
- User registration and login with JWT tokens
- OTP-based password reset (printed to server console in dev)
- Role-based access control — 4 distinct user roles
- Session persistence via localStorage + `/auth/me` verification
- Automatic logout on token expiry (401 interceptor)

### 📊 Dashboard
- Real-time KPI cards: Total Products, Low Stock, Out of Stock, Pending Receipts, Pending Deliveries
- Stock Alerts panel showing all products below reorder point
- Recent Stock Movements feed with color-coded quantities
- Dismissable low-stock alert banner

### 📦 Product Management
- Full CRUD for products (name, SKU, category, unit of measure, reorder point)
- Low Stock and Out of Stock badges on product rows
- Stock status filter (In Stock / Low Stock / Out of Stock)
- **CSV bulk import** with preview, template download, and error reporting
- **Quick Restock** button on low/out-of-stock products — creates a receipt pre-filled with product details
- Category management

### 📥 Receipts (Incoming Stock)
- Create receipts with supplier name and multiple product lines
- Status workflow: Draft → Waiting → Ready → Done / Cancelled
- Validate receipt → stock automatically increases in inventory
- Role-restricted: only Inventory Manager and Admin can validate

### 🚚 Deliveries (Outgoing Stock)
- 3-step workflow: Pick → Pack → Validate
- Visual step indicator showing progress
- Validate delivery → stock automatically decreases
- Insufficient stock check — rejects if not enough on hand
- Role-restricted: Dispatcher handles Pick/Pack, Manager validates

### 🔄 Internal Transfers
- Move stock between any two warehouse locations
- Source and destination location selectors
- Confirm transfer → stock moves from source to destination
- Full audit trail logged in stock ledger

### 🔧 Stock Adjustments
- Fix discrepancies between system records and physical counts
- Per-product counted quantity input
- System auto-calculates difference (positive or negative)
- Apply adjustment → stock updated and delta logged

### 📋 Stock Move History (Ledger)
- Complete audit trail of every stock movement
- Filterable by type (Receipt / Delivery / Transfer / Adjustment)
- Date range filter
- Search by product name or SKU
- Color-coded quantities: green (+) for incoming, red (−) for outgoing
- Meaningful labels: "Supplier" for receipt source, "Customer" for delivery destination

### 🏭 Warehouse Management
- Multi-warehouse support
- Locations and zones within each warehouse
- Admin-only access

### 👥 User Management
- View all users with role badges
- Change user roles via dropdown
- Deactivate / Reactivate users (safe — preserves transaction history)
- Admin-only access

### 📖 API Documentation
- Full Swagger UI at `http://localhost:5000/api-docs`
- All endpoints documented with request/response schemas
- JWT bearer auth built into Swagger UI
- Try any endpoint live from the browser

---

## 🔑 Demo Credentials

> All accounts use the same password for demo purposes.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@stockify.com` | `stockify123` |
| **Inventory Manager** | `manager@stockify.com` | `stockify123` |
| **Warehouse Staff** | `staff@stockify.com` | `stockify123` |
| **Dispatcher** | `dispatcher@stockify.com` | `stockify123` |

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL running locally
- Git

### Step 1 — Clone the repository
```bash
git clone https://github.com/your-username/OdooXIndus_Hackathon.git
cd OdooXIndus_Hackathon
```

### Step 2 — Create the database
Open MySQL Workbench and run:
```sql
CREATE DATABASE stockify_db;
CREATE USER 'stockify_user'@'localhost' IDENTIFIED BY 'stockify123';
GRANT ALL PRIVILEGES ON stockify_db.* TO 'stockify_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3 — Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your DB_PASS
npm run db:migrate
npm run db:seed
npm run dev
```

### Step 4 — Frontend setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Step 5 — Open in browser
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/v1 |
| Swagger Docs | http://localhost:5000/api-docs |
| Health Check | http://localhost:5000/api/v1/health |

---

## 📁 Project Structure

```
OdooXIndus_Hackathon/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env config
│   │   ├── models/          # Sequelize models + associations
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Request handlers (thin layer)
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # auth.js, rbac.js, validate.js, errorHandler.js
│   │   ├── validators/      # Zod schemas
│   │   ├── utils/           # catchAsync, AppError, jwt, refGen
│   │   └── docs/            # Swagger config
│   ├── migrations/          # 15 ordered migration files
│   ├── seeders/             # Demo data seeder
│   ├── server.js            # Express entry point
│   └── .env.example
│
├── frontend/
│   ├── pages/               # Next.js pages
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── receipts.js
│   │   ├── deliveries.js
│   │   ├── transfers.js
│   │   ├── adjustments.js
│   │   ├── move-history.js
│   │   ├── warehouses.js
│   │   ├── users.js
│   │   ├── login.js
│   │   └── register.js
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DataTable.jsx
│   │   ├── Modal.jsx
│   │   ├── KPICard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── FilterBar.jsx
│   │   ├── StepIndicator.jsx
│   │   ├── ProductLineForm.jsx
│   │   ├── AlertBanner.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/
│   │   └── AuthContext.js   # JWT auth state
│   ├── lib/
│   │   └── api.js           # Axios instance + interceptors
│   └── .env.local.example
│
└── README.md
```

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | System users with roles |
| `categories` | Product categories |
| `warehouses` | Warehouse locations |
| `locations` | Zones within warehouses |
| `products` | Product catalog with SKUs |
| `inventory` | Current stock per product per location |
| `receipts` | Incoming goods orders |
| `receipt_lines` | Individual product lines on receipts |
| `deliveries` | Outgoing goods orders |
| `delivery_lines` | Individual product lines on deliveries |
| `transfers` | Internal stock movement orders |
| `transfer_lines` | Product lines on transfers |
| `adjustments` | Stock count corrections |
| `adjustment_lines` | Product lines on adjustments |
| `stock_moves` | **Audit ledger** — every stock change ever made |

---

## 👨‍💻 Team

| Member | Role |
|--------|------|
| **Jitaan Rathod** | Backend Engineer — Node.js, Express, API, Auth |
| **Martin Patel** | Frontend Engineer — Next.js, Tailwind, UI/UX |
| **Rushwa Shah** | Database Engineer — MySQL, Sequelize, Migrations |
| **Fenil Kossti** | Integration & DevOps — Git, API wiring, Testing |

---

## 📄 API Endpoints Summary

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password` |
| Products | `GET/POST /products` · `GET/PUT/DELETE /products/:id` |
| Categories | `GET/POST /categories` · `GET/PUT/DELETE /categories/:id` |
| Warehouses | `GET/POST /warehouses` · `GET/PUT/DELETE /warehouses/:id` |
| Locations | `GET/POST /locations` · `GET/PUT/DELETE /locations/:id` |
| Receipts | `GET/POST /receipts` · `POST /receipts/:id/validate` · `POST /receipts/:id/cancel` |
| Deliveries | `GET/POST /deliveries` · `POST /deliveries/:id/pick` · `POST /deliveries/:id/pack` · `POST /deliveries/:id/validate` |
| Transfers | `GET/POST /transfers` · `POST /transfers/:id/confirm` · `POST /transfers/:id/cancel` |
| Adjustments | `GET/POST /adjustments` · `POST /adjustments/:id/apply` |
| Inventory | `GET /inventory` |
| Stock Moves | `GET /stock-moves` |
| Dashboard | `GET /dashboard` |
| Alerts | `GET /alerts` |
| Users | `GET /users` · `PUT /users/:id` |
| Health | `GET /health` |

> **Full interactive docs:** `http://localhost:5000/api-docs`

---

*Built with ❤️ for Odoo × Indus Hackathon*