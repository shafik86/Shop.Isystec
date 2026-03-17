# Izwan Systec — Ecommerce Platform

Full-stack ecommerce web application built for Izwan Systec Sdn Bhd.

**Stack:** Node.js + Express · PostgreSQL · React 19 + Vite · Bootstrap 5 · Tailwind CSS

---

## Features

- **Customer** — Product catalog, shopping cart, checkout, vouchers, order history, account management
- **Admin Panel** — Product CRUD with image upload, categories, orders, vouchers, payment gateway config, settings
- **Auth** — JWT-based authentication, role-based access (admin / customer)
- **Payment Gateways** — Stripe, SenangPay, Billplz (configurable from admin panel)
- **Images** — Stored as base64 in PostgreSQL (no external storage needed)

---

## Project Structure

```
├── backend/          Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── scripts/
│   │   └── create_admin.js   ← run once after DB setup
│   └── .env.example
├── frontend/         React + Vite
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── services/
└── database/
    └── setup.sql     ← run on fresh server to create all tables
```

---

## Server Setup Guide

### 1. Requirements

- Node.js 18+
- PostgreSQL 14+
- Git

### 2. Clone the Repository

```bash
git clone https://github.com/shafik86/Shop.Isystec.git
cd Shop.Isystec
```

### 3. Database Setup

```bash
# Login to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE izwan_ecommerce;
\q

# Run the setup script (creates all tables + seeds payment gateways)
psql -U postgres -d izwan_ecommerce -f database/setup.sql
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
nano .env   # edit DB credentials, JWT secret, etc.

# Create admin user (run once)
node scripts/create_admin.js

# Start server
npm run dev          # development (nodemon)
node src/app.js      # production
```

**Default admin credentials** (change after first login):
- Email: `admin@izwan.com`
- Password: `admin123`

To use custom credentials:
```bash
ADMIN_EMAIL="you@company.com" ADMIN_PASSWORD="strongpass" node scripts/create_admin.js
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# For development (with proxy to localhost:5000)
npm run dev

# For production build
npm run build
# Serve the dist/ folder with nginx or similar
```

### 6. Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `PORT` | API server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `yourpassword` |
| `DB_NAME` | Database name | `izwan_ecommerce` |
| `JWT_SECRET` | JWT signing key (keep secret!) | `random64chars` |
| `JWT_EXPIRE` | Token expiry | `7d` |
| `CORS_ORIGIN` | Allowed frontend URL | `https://yourdomain.com` |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## API Documentation

Once backend is running, Swagger UI is available at:
```
http://localhost:5000/swagger
```

---

## Payment Gateway Configuration

Payment gateway API keys are stored in the database and configured through the **Admin Panel → Payment Gateways** page. No hardcoded keys in `.env`.

Supported gateways:
- **Billplz** — API Key, Collection ID, X-Signature Key, Callback URL
- **SenangPay** — Merchant ID, Secret Key, Callback URL
- **Stripe** — Publishable Key, Secret Key, Webhook Secret

---

## Default URLs (Development)

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger Docs | http://localhost:5000/swagger |
| Admin Panel | http://localhost:5173/admin |
