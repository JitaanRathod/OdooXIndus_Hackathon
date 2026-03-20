# 📦 Stockify — Production-Grade Inventory Management System

> A **production-ready**, real-time Inventory Management System built for the **Odoo × Indus Hackathon** and upgraded to a full enterprise-grade application — featuring a modern animated UI, RBAC security, atomic DB transactions, and free-tier cloud deployment support.

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
│   │   Framer Motion  │ ◄──────  │   JWT + RBAC Auth        │   │
│   │   Lucide Icons   │  JSON   │   Zod Validation         │   │
│   └──────────────────┘          │   Swagger UI /api-docs   │   │
│                                 └────────────┬─────────────┘   │
│                                              │ Sequelize ORM    │
│                                              ▼                  │
│                                 ┌──────────────────────────┐   │
│                                 │       DATABASE           │   │
│                                 │   MySQL (Local / Cloud)  │   │
│                                 │   15 Tables              │   │
│                                 │   Migrations + Seeders   │   │
│                                 └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (Pages Router) | React framework with SSR support |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Animations** | Framer Motion | Page transitions, spring physics, micro-animations |
| **Icons** | Lucide React | Consistent SVG icon system |
| **Notifications** | react-hot-toast | Global toast notification system |
| **CSV Parsing** | papaparse | Robust CSV import (handles quoted commas) |
| **HTTP Client** | Axios | API calls with JWT interceptor |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MySQL | Relational data storage |
| **ORM** | Sequelize | Models, migrations, transactions, seeders |
| **Auth** | JWT (jsonwebtoken) | Stateless authentication |
| **Access Control** | Custom RBAC Middleware | Role-based route protection |
| **Validation** | Zod | Request body validation |
| **Security** | express-rate-limit | Rate limiting on auth routes |
| **API Docs** | Swagger UI | Live interactive API explorer |
| **Password** | bcryptjs | Secure password hashing |

---

## ✨ Features

### 🎨 Modern UI/UX
- **Animated Login Page** — dark glassmorphism design with cursor-following gradient blobs (spring physics), floating particle dots, grid texture overlay
- **One-click role login** — 4 quick-access buttons (Admin 👑, Inventory Manager 📦, Warehouse Staff 🏭, Dispatcher 🚚)
- **Instant page transitions** — Framer Motion with optimized non-blocking animations (~150ms)
- **Sidebar** — animated active indicator, role-based avatar color hashing, smooth mobile drawer
- **KPI Cards** — animated count-up numbers, hover lift effects, trend indicators
- **DataTable** — skeleton loading rows, sortable columns, staggered row entrance animations
- **Per-row stock highlighting** — Out-of-stock rows glow red (left border accent), low-stock rows glow amber
- **Animated alert banners** — gradient buttons with pulsing ping dots for critical stock warnings

### 🔔 Notifications & Dialogs
- **react-hot-toast** — branded success/error/info toasts on every action
- **ConfirmDialog** — spring-animated modal replacing all `window.confirm()` calls
- **StatusBadge** — animated pulse dots for active workflow states

### 🔐 Authentication & Security
- JWT-based login, OTP password reset via email
- Role-based access control (RBAC) — 4 roles with granular permissions
- **Rate limiting** — 20 requests / 15 min on auth routes (express-rate-limit)
- **SQL injection prevention** — allowlist + parameterized queries in `refGen.js`
- **Race condition protection** — `SELECT ... FOR UPDATE` locks in transfer/delivery services
- Multi-origin **CORS** configured for simultaneous localhost + Vercel deployment
- Payload size limit (2 MB), `trust proxy` for Railway

### 📊 Dashboard
- Real-time KPI cards: Total Products, Low Stock Items, Out of Stock, Pending Receipts, Pending Deliveries, Scheduled Transfers
- **Fixed**: New products with zero inventory (never received) now correctly counted as out-of-stock via `LEFT JOIN` SQL
- Stock Alerts panel — all products at or below reorder point, sorted by urgency
- Recent Stock Moves feed with color-coded quantities (+/-)

### 📦 Product Management
- Full CRUD with **animated confirmation dialogs** instead of `window.confirm()`
- **Eye-catching stock badges** — solid filled pills with animated ping ring (Out of Stock / Low Stock)
- **Click any row** → Location Breakdown Modal showing per-warehouse/location stock with visual progress bars and % of total
- Stock status filter with clickable alert button shortcut
- **CSV bulk import** powered by `papaparse` (handles commas inside quoted fields, edge cases fixed)
- Quick Restock shortcut from detail modal
- Deletion blocked if product has inventory history (409 + guidance message)

### 📥 Receipts
- Multi-line receipt creation, supplier tracking
- Workflow: Draft → Waiting → Ready → Done / Cancelled
- **Detail modal** — click any row to see all product lines (expected vs received qty)
- Stock atomically updated in DB transaction on validation
- Inventory Manager can cancel (RBAC fixed)

### 🚚 Deliveries
- Full 4-step workflow: Draft → Picking → Packing → Done
- **Detail modal** with StepIndicator progress and product lines
- Per-row action loading states, ConfirmDialog on cancel
- `SELECT ... FOR UPDATE` lock prevents concurrent over-selling

### 🔄 Internal Transfers
- Move stock between warehouse locations, per-location stock validation
- Confirm uses DB transaction with inventory lock
- Inventory Manager added to allowed roles (RBAC fix)

### 🔧 Stock Adjustments
- **Live system qty display** — shows existing qty for the selected location while entering counted qty
- Amber highlight when counted qty differs from system qty
- Atomic transaction on apply, zero-delta guard (no phantom stock moves)

### 📋 Move History / Audit Ledger
- Server-side search by product name or SKU
- Date range filter, type filter
- Pagination support, record count badge

### 👥 User Management
- Deterministic avatar color based on name hash
- Role dropdown (disabled on own account)
- Deactivate / Reactivate with ConfirmDialog (preserves transaction history)

### 🏭 Warehouse & Location Management
- Multi-warehouse, multi-zone support
- Admin-only access

---

## 🔑 Demo Credentials

> All accounts share the same password.

| Role | Email | Password | Landing Page |
|------|-------|----------|-------------|
| 👑 **Admin** | `admin@stockify.com` | `stockify123` | Dashboard |
| 📦 **Inventory Manager** | `manager@stockify.com` | `stockify123` | Dashboard |
| 🏭 **Warehouse Staff** | `staff@stockify.com` | `stockify123` | Dashboard |
| 🚚 **Dispatcher** | `dispatcher@stockify.com` | `stockify123` | Deliveries |

> Or click the **Quick Access** role buttons on the login page to sign in instantly.

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally
- Git

### 1 — Clone
```bash
git clone https://github.com/your-username/OdooXIndus_Hackathon.git
cd OdooXIndus_Hackathon
```

### 2 — Create the database
```sql
CREATE DATABASE stockify_db;
CREATE USER 'stockify_user'@'localhost' IDENTIFIED BY 'stockify123';
GRANT ALL PRIVILEGES ON stockify_db.* TO 'stockify_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3 — Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev          # starts on :5000
```

### 4 — Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev          # starts on :3000
```

### 5 — Open in browser

| Service | URL |
|---------|-----|
| **App** | http://localhost:3000 |
| **API** | http://localhost:5000/api/v1 |
| **Swagger Docs** | http://localhost:5000/api-docs |
| **Health Check** | http://localhost:5000/api/v1/health |

---

## ☁️ Free Cloud Deployment

### Backend → Railway (free tier)

1. Push `backend/` to GitHub
2. Create a new Railway project → **Deploy from GitHub**
3. Add a **MySQL** plugin — Railway auto-sets `DATABASE_URL`
4. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<strong-secret>
   ALLOWED_ORIGINS=https://your-app.vercel.app
   DATABASE_URL=<auto-filled by Railway MySQL plugin>
   ```
5. Railway uses `railway.json` (already included) for build/start/healthcheck config

### Frontend → Vercel (free tier)

1. Push `frontend/` to GitHub
2. Create new Vercel project → import repo, set root to `frontend/`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api/v1
   ```
4. `vercel.json` (already included) handles framework config and rewrites

---

## 📁 Project Structure

```
OdooXIndus_Hackathon/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (supports DATABASE_URL for Railway)
│   │   ├── models/          # Sequelize models + associations
│   │   ├── routes/          # Express route definitions (RBAC fixed)
│   │   ├── controllers/     # Thin request handlers
│   │   ├── services/        # Business logic + DB transactions
│   │   │   ├── receipt.service.js      # Atomic validate()
│   │   │   ├── delivery.service.js     # LOCK.UPDATE on validate()
│   │   │   ├── transfer.service.js     # LOCK.UPDATE on confirm()
│   │   │   ├── adjustment.service.js   # Atomic apply()
│   │   │   ├── product.service.js      # qty_on_hand aggregate, FK delete guard
│   │   │   ├── dashboard.service.js    # LEFT JOIN for zero-inventory products
│   │   │   ├── alerts.service.js       # LEFT JOIN for new products
│   │   │   └── stockmove.service.js    # Search + pagination
│   │   ├── middleware/      # auth.js, rbac.js, validate.js, errorHandler.js
│   │   ├── validators/      # Zod schemas
│   │   └── utils/           # catchAsync, AppError, refGen (SQL injection fixed)
│   ├── migrations/          # 15 ordered migration files
│   ├── seeders/             # Demo data seeder
│   ├── server.js            # Express entry + rate-limit + CORS + trust proxy
│   ├── railway.json         # Railway deployment config
│   └── .env.example
│
├── frontend/
│   ├── pages/
│   │   ├── login.js         # Animated bg, glassmorphism, role quick-login
│   │   ├── dashboard.js     # KPI cards, stock alerts, recent moves
│   │   ├── products.js      # CRUD, CSV import, location breakdown modal
│   │   ├── receipts.js      # Workflow + detail modal
│   │   ├── deliveries.js    # 4-step workflow + detail modal
│   │   ├── transfers.js     # Confirm/cancel with RBAC fix
│   │   ├── adjustments.js   # Live system qty display
│   │   ├── move-history.js  # Server-side search + date filter
│   │   ├── warehouses.js
│   │   └── users.js         # Avatar colors, ConfirmDialog, role selector
│   ├── components/
│   │   ├── Layout.jsx       # Sticky header, breadcrumb, fast page transitions
│   │   ├── Sidebar.jsx      # Lucide icons, animated active indicator
│   │   ├── DataTable.jsx    # Skeleton loading, sort, row highlights, pagination
│   │   ├── Modal.jsx        # Spring animation, scroll lock
│   │   ├── KPICard.jsx      # Count-up, hover lift, trend indicator
│   │   ├── StatusBadge.jsx  # Animated pulse dots
│   │   ├── FilterBar.jsx    # Animated search + smart clear
│   │   ├── StepIndicator.jsx# Animated connector fill
│   │   ├── ConfirmDialog.jsx# Replaces window.confirm()
│   │   ├── Toast.jsx        # react-hot-toast provider
│   │   └── LoadingSpinner.jsx
│   ├── context/AuthContext.js
│   ├── lib/api.js           # Axios + JWT interceptor
│   ├── styles/globals.css   # Design tokens, component classes, keyframes
│   ├── vercel.json          # Vercel deployment config
│   └── .env.local.example
│
└── README.md
```

---

## 🗄️ Database Tables (15)

| Table | Description |
|-------|-------------|
| `users` | System users with roles and active status |
| `categories` | Product categories |
| `warehouses` | Physical warehouse buildings |
| `locations` | Zones/bins within each warehouse |
| `products` | Product catalog (SKU, category, reorder point) |
| `inventory` | Current stock per product **per location** |
| `receipts` | Incoming goods purchase orders |
| `receipt_lines` | Product lines on each receipt |
| `deliveries` | Outgoing goods orders |
| `delivery_lines` | Product lines on each delivery |
| `transfers` | Internal stock movement orders |
| `transfer_lines` | Product lines on each transfer |
| `adjustments` | Physical stock count corrections |
| `adjustment_lines` | Product lines on each adjustment |
| `stock_moves` | **Immutable audit ledger** — every stock change ever made |

---

## 🔐 Role Permissions Matrix

| Feature | Admin | Inv. Manager | WH Staff | Dispatcher |
|---------|:-----:|:------------:|:--------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products CRUD | ✅ | ✅ | 👁️ | ❌ |
| CSV Import | ✅ | ✅ | ❌ | ❌ |
| Create Receipt | ✅ | ✅ | ✅ | ❌ |
| Validate Receipt | ✅ | ✅ | ❌ | ❌ |
| Cancel Receipt | ✅ | ✅ | ❌ | ❌ |
| Create Delivery | ✅ | ✅ | ❌ | ✅ |
| Pick / Pack Delivery | ✅ | ✅ | ✅ | ✅ |
| Validate Delivery | ✅ | ✅ | ❌ | ❌ |
| Create Transfer | ✅ | ✅ | ✅ | ❌ |
| Confirm Transfer | ✅ | ✅ | ❌ | ❌ |
| Stock Adjustments | ✅ | ✅ | ✅ | ❌ |
| Users Management | ✅ | ❌ | ❌ | ❌ |
| Warehouses/Locations | ✅ | ❌ | ❌ | ❌ |

---

## 📄 API Endpoints

| Resource | Endpoints |
|----------|-----------|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password` |
| **Products** | `GET/POST /products` · `GET/PUT/DELETE /products/:id` |
| **Categories** | `GET/POST /categories` · `GET/PUT/DELETE /categories/:id` |
| **Warehouses** | `GET/POST /warehouses` · `GET/PUT/DELETE /warehouses/:id` |
| **Locations** | `GET/POST /locations` · `GET/PUT/DELETE /locations/:id` |
| **Receipts** | `GET/POST /receipts` · `GET /receipts/:id` · `POST /receipts/:id/validate` · `POST /receipts/:id/cancel` |
| **Deliveries** | `GET/POST /deliveries` · `GET /deliveries/:id` · `POST /deliveries/:id/pick` · `/pack` · `/validate` · `/cancel` |
| **Transfers** | `GET/POST /transfers` · `POST /transfers/:id/confirm` · `/cancel` |
| **Adjustments** | `GET/POST /adjustments` · `POST /adjustments/:id/apply` |
| **Inventory** | `GET /inventory?product_id=&location_id=` |
| **Stock Moves** | `GET /stock-moves?search=&limit=&offset=&date_from=&date_to=` |
| **Dashboard** | `GET /dashboard` |
| **Alerts** | `GET /alerts` |
| **Users** | `GET /users` · `PUT /users/:id` |
| **Health** | `GET /health` |

> **Full interactive docs:** `http://localhost:5000/api-docs`

---

## 👨‍💻 Team

| Member | Role |
|--------|------|
| **Jitaan Rathod** | Backend Engineer — Node.js, Express, API, Auth |
| **Martin Patel** | Frontend Engineer — Next.js, Tailwind, UI/UX |
| **Rushwa Shah** | Database Engineer — MySQL, Sequelize, Migrations |
| **Fenil Kossti** | Integration & DevOps — Git, API wiring, Testing |

---

*Built with ❤️ for Odoo × Indus Hackathon · Upgraded to production-grade*