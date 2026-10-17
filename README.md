# NovaStore - Full-Stack Production E-Commerce Platform

NovaStore is an enterprise-grade full-stack e-commerce web application engineered with modern web standards, role-based access control, responsive Material UI design, atomic inventory transactions, and high-performance REST APIs.

---

## 🌟 Architecture & Technology Stack

### Frontend
- **Framework**: React 19 with Vite.
- **Design System & Components**: **Material UI (MUI v6)** exclusively (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`).
- **Routing**: React Router v7 (`react-router-dom`).
- **HTTP Client**: Axios with credentials and automatic bearer token fallback.
- **State Management**: React Context API for Authentication (`AuthContext`), Shopping Cart with persistence and guest merger (`CartContext`), Wishlist (`WishlistContext`), and Global Notifications (`NotificationContext`).
- **Typography & Aesthetics**: Curated typography via Google Fonts (`Plus Jakarta Sans` and `Outfit`), smooth micro-animations, responsive cards, and pure MUI dashboard visualizations.

### Backend
- **Runtime**: Node.js v24+ with JavaScript ES Modules (`"type": "module"`).
- **Framework**: Express.js RESTful API architecture.
- **Database & ODM**: MongoDB with Mongoose ODM (indexes, validation, references, and aggregation pipelines).
- **Security**: JWT Authentication with secure HTTP-only cookies, bcrypt password hashing, Helmet HTTP security headers, CORS with whitelist origin configuration, express-rate-limit protection.
- **Uploads**: Multer with dedicated storage service abstraction, MIME/extension verification, and randomized safe file naming.
- **Inventory Consistency**: Atomic inventory updates on checkout and cancellation preventing overselling and race conditions.

---

## 🚀 Features Overview

### 1. Customer Storefront
- **Global Header**: Store branding, search with instant query filtering, category dropdowns, wishlist & live cart badges, mobile responsive drawer.
- **Dynamic Promotional Hero Slider**: Fully controllable via Admin Console with autoplay, manual controls, and call-to-action routing.
- **Curated Product Collections**: Trending, Featured, Best Sellers (computed from actual fulfilled sales), and New Arrivals.
- **Product Catalog & Search (`/shop`)**:
  - Filter by category & subcategory, brand, price slider, minimum star rating, and in-stock availability.
  - Sort by newest, price (low to high / high to low), customer rating, and popularity.
  - Server-side pagination and synchronized URL query parameters.
- **Product Details (`/product/:slug`)**:
  - Multi-image gallery with thumbnail navigation.
  - Specifications table and variant selector (size, color, options).
  - Quantity selector with live stock validation.
  - Verified customer reviews and review submission modal.
  - Related product recommendations.
- **Shopping Cart (`/cart`)**:
  - Persistent MongoDB cart for authenticated customers with automatic guest localStorage cart merging upon sign in.
  - Server-side coupon code validation (`WELCOME10`, `SAVE20`, `VIP50`).
  - Automatic free shipping calculation when cart reaches $50 threshold.
- **Wishlist (`/wishlist`)**:
  - Customer bookmarking with 1-click move to cart.
- **Multi-Step Checkout (`/checkout`)**:
  - Step 1: Select saved shipping address or enter new delivery destination.
  - Step 2: Payment method selection (Cash on Delivery or Development Card Gateway).
  - Step 3: Verified server-side total review and atomic order placement.
- **Customer Account (`/account`)**:
  - Profile management & password changes.
  - Order history with statuses (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
  - Order details view with item snapshots, courier tracking numbers, and cancellation for eligible orders.
  - Saved delivery addresses management.

### 2. Admin Management Dashboard (`/admin`)
- **Protected RBAC**: Role-based authorization guarding all admin views and `/api/v1/admin/*` endpoints.
- **Analytics Overview**:
  - Gross sales revenue, total order volume, active customer count, low-stock warnings.
  - Pure MUI-based weekly revenue distribution bar chart.
  - Recent orders feed and top-selling products.
- **Product Catalog Management (`/admin/products`)**:
  - Complete CRUD with SKU uniqueness validation, multi-image inputs, category/brand assignment, price and stock controls, and trending/featured flags.
- **Category & Subcategory Hierarchy (`/admin/categories`)**:
  - Parent-child category nesting, display order, slugs, and deletion protection for categories with assigned products.
- **Brand Management (`/admin/brands`)**:
  - Official manufacturer records, logos, and website links.
- **Promotional Slider Management (`/admin/banners`)**:
  - Banner creation, image configuration, display ordering, and live activation toggles.
- **Order Fulfillment Console (`/admin/orders`)**:
  - Status transitions (`pending` &rarr; `processing` &rarr; `shipped` &rarr; `delivered` or `cancelled`).
  - Courier assignment and shipment tracking numbers.
  - Inventory restocking on cancellations.
- **Customer Management (`/admin/customers`)**:
  - Searchable customer directory with lifetime purchase amounts and account active/disabled toggling.
- **Coupons & Promotions (`/admin/coupons`)**:
  - Percentage or fixed dollar discounts, usage limit counters, and expiration dates.
- **Inventory Audit Ledger (`/admin/inventory`)**:
  - Urgent low-stock notifications and complete audit trail of sales and restock adjustments.
- **Store Configuration (`/admin/settings`)**:
  - Store identity, contact information, shipping fee rules, payment gateways, and announcement bar.

---

## 📁 Repository Structure

```
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/         # Reusable MUI components (ProductCard, HeroSlider, etc.)
│   │   ├── contexts/           # Auth, Cart, Wishlist, Notification Contexts
│   │   ├── layouts/            # StoreLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── account/        # Customer Profile, Orders, Addresses
│   │   │   ├── admin/          # Admin Dashboard, Products, Orders, etc.
│   │   │   ├── auth/           # Login, Register
│   │   │   └── store/          # HomePage, ShopPage, ProductDetails, Cart, Checkout
│   │   ├── services/           # Axios API services
│   │   ├── App.jsx             # Root App provider tree
│   │   ├── router.jsx          # React Router v7 configuration
│   │   ├── theme.js            # Material UI custom theme system
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB connection (MongoDB / Memory server fallback), env
│   │   ├── controllers/        # Express HTTP controllers
│   │   ├── middlewares/        # Auth, Role (RBAC), Upload (Multer), Validation, Error handler
│   │   ├── models/             # Mongoose schemas (User, Product, Category, Order, etc.)
│   │   ├── routes/             # RESTful API routes (/api/v1/...)
│   │   ├── scripts/            # Database seed script
│   │   ├── services/           # Storage service abstraction
│   │   ├── tests/              # Automated API test suite
│   │   ├── utils/              # JWT, API responses, slugify
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server bootstrap
│   ├── uploads/                # Local media uploads storage
│   ├── .env.example
│   └── package.json
│
├── package.json                # Monorepo workspace configuration
└── README.md
```

---

## 🛠️ Setup & Installation Instructions

### Prerequisites
- Node.js (v18 or higher; tested on v24)
- npm (v9 or higher)
- MongoDB instance (or local MongoDB server on port 27017).

### 1. Clone & Install Dependencies
From the repository root:
```bash
npm install
```
This automatically installs dependencies across both `server` and `client` workspaces.

### 2. Environment Variables Configuration
Create `.env` in `server/`:
```bash
cp server/.env.example server/.env
```
Default `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_ACCESS_SECRET=super_secret_access_jwt_key_development_change_in_production
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_development_change_in_production
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
ADMIN_EMAIL=admin@store.com
ADMIN_PASSWORD=Admin@123456
```

Create `.env` in `client/`:
```bash
cp client/.env.example client/.env
```
Default `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Seed Database
Initialize the database with rich categories, global brands, products, promotional banners, coupons, and demonstration accounts:
```bash
npm run seed
```

**Pre-Configured Accounts:**
| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@store.com` | `Admin@123456` |
| **Customer** | `john@example.com` | `Customer@123456` |

*(Quick one-click login buttons are also provided directly on `/login`.)*

### 4. Running the Application Locally
Run both backend API and frontend dev server concurrently:
```bash
npm run dev
```
Or run individually:
```bash
# Start backend server (http://localhost:5000)
npm run dev:server

# Start frontend client (http://localhost:5173)
npm run dev:client
```

---

## 🧪 Running Automated Tests

Run the backend integration test suite:
```bash
npm test
```
The test suite validates:
- Admin and Customer login and JWT issuance
- Category, banner, and home section data delivery
- Coupon code calculation & validation
- Role-based authorization security (verifying non-admins receive 403 on admin endpoints)
- Admin dashboard aggregation metrics
- Cart addition and order checkout validation

---

## 🔒 Security Best Practices
- **Authentication**: JWT tokens transmitted via secure HTTP-only cookies or Authorization header.
- **Passwords**: Salted hashing with `bcryptjs`. Passwords omitted from database responses via Mongoose `select: false`.
- **Validation**: Strict schema constraints and express-validator checking on all endpoints.
- **Rate Limiting**: `express-rate-limit` active on sensitive auth routes to prevent brute-force attacks.
- **Header Protection**: `helmet` headers active with CORS origin restriction.
- **Financial & Stock Integrity**: Client-submitted pricing or totals are never trusted; totals and stock deductions are recalculated and enforced server-side.

---

## 🚢 Production Deployment Notes
The application is a stateless Express API with MongoDB as its shared data store, but it is not a turnkey production deployment. Before deploying:

1. Set `NODE_ENV=production`, an HTTPS `CLIENT_URL` (comma-separated origins are supported), and a production `MONGODB_URI`.
2. Set independent, randomly generated `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values of at least 32 characters. Production startup fails fast if required settings are missing or weak.
3. Set a non-demo `ADMIN_PASSWORD`; never run the demo seed script against production data. Seeding is disabled when `NODE_ENV=production`.
4. Run behind TLS termination and set `TRUST_PROXY` to the exact trusted proxy hop count (do not enable it indiscriminately). Keep MongoDB private and use a least-privilege database user.
5. Size `MONGODB_MAX_POOL_SIZE` / `MONGODB_MIN_POOL_SIZE` for the MongoDB connection budget across *all* API replicas. The default max pool is 50 per process, not a cluster-wide cap.
6. Configure durable shared object storage and a CDN for uploads before running multiple API replicas. The current upload service writes to local disk, which is ephemeral and not shared across instances.
7. Configure backups and restore drills, monitoring/alerting, log retention, and deployment rollback. `/health/live` is the process liveness check and `/health/ready` checks MongoDB readiness.
8. Build the production client bundle:
   ```bash
   npm run build
   ```
9. Serve the built client from a static hosting/CDN platform and configure SPA fallback plus the API URL through `VITE_API_BASE_URL`.

The server uses in-memory rate limiting. For multi-replica production, replace it with a shared store (such as Redis) so limits are consistent across instances. API replicas also require shared upload storage; deploying more replicas without addressing these two items does not provide consistent global rate limiting or media availability. Use a managed MongoDB replica set and evaluate transaction behavior, capacity, and backup recovery for your workload before launch.

---

## 🔔 Order Notification Chime & Buzzer Sound

NovaStore includes a lightweight, zero-dependency Web Audio API sound synthesis engine for order confirmations and seller/admin order arrival alerts (`client/src/utils/orderSound.js`).

### How It Works
- **Order Confirmation**: When an order is successfully placed via `CheckoutPage`, it plays a pleasant ascending two-tone chime (`C5` 523.25 Hz &rarr; `G5` 783.99 Hz) for ~0.45s at a moderate volume (0.45).
- **Admin Order Buzzer**: In the Admin Dashboard (`DashboardPage`), when a newly placed order is detected via polling, an alert chirp (`659.25` Hz &rarr; `880` Hz) sounds to notify staff.
- **Autoplay Compliance**: Unlocks the browser's `AudioContext` on the first user click/touch/keypress and handles blocked autoplay gracefully without throwing errors.
- **Mute Preference**: Saved in `localStorage` under `novastore_sound_muted` and toggleable via the speaker icon in the store header or admin navigation bar.

### Customizing or Replacing the Sound
1. **Change Pitch & Frequencies**:
   In `client/src/utils/orderSound.js`, locate `playOrderPlacedSound()`:
   ```javascript
   osc1.frequency.setValueAtTime(523.25, now); // First tone (Hz)
   osc2.frequency.setValueAtTime(783.99, now + 0.12); // Second tone (Hz)
   ```
2. **Adjust Volume & Duration**:
   Update `masterGain.gain.setValueAtTime(0.45, now)` (range `0.0` to `1.0`) or change the stop timing (under 1 second).
3. **Use a Custom Audio File (e.g. MP3/WAV)**:
   If you prefer an external audio file, replace the oscillator logic inside `playOrderPlacedSound()` with:
   ```javascript
   const audio = new Audio('/sounds/chime.mp3');
   audio.volume = 0.5;
   audio.play().catch(() => {});
   ```

### How to Test
1. Add an item to your cart and proceed to Checkout (`/checkout`).
2. Complete shipping details, select Payment Method, and click **Place Order**.
3. Upon receiving the successful API response, the confirmation chime will play.
4. Toggle the speaker icon in the top header to mute; place another order to verify it stays silent.

