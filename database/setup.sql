-- ============================================================
--  Izwan Systec Ecommerce — Full Database Setup Script
--  Run this on a fresh PostgreSQL server to create all tables.
--
--  Usage:
--    psql -U postgres -d izwan_ecommerce -f setup.sql
--
--  Create DB first (run as postgres superuser):
--    CREATE DATABASE izwan_ecommerce;
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    phone       VARCHAR(30),
    role        VARCHAR(20) DEFAULT 'customer',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── CATEGORIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    slug        VARCHAR(150) UNIQUE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price       NUMERIC(12,2) NOT NULL,
    stock       INTEGER DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'draft',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCT IMAGES ─────────────────────────────────────────
-- Images stored as base64 strings directly in the database
CREATE TABLE IF NOT EXISTS product_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID REFERENCES products(id) ON DELETE CASCADE,
    image_base64 TEXT,
    position     INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── CARTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id     UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id),
    qty         INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(50) UNIQUE,
    user_id         UUID REFERENCES users(id),
    total_price     NUMERIC(12,2),
    payment_method  VARCHAR(30),
    payment_status  VARCHAR(20) DEFAULT 'pending',
    order_status    VARCHAR(20) DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id),
    price       NUMERIC(12,2),
    qty         INTEGER
);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    gateway         VARCHAR(30),
    transaction_id  VARCHAR(150),
    amount          NUMERIC(12,2),
    status          VARCHAR(20),
    raw_response    JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── VOUCHERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vouchers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) UNIQUE,
    discount_type   VARCHAR(20),   -- 'percent' or 'fixed'
    discount_value  NUMERIC(10,2),
    usage_limit     INTEGER,
    expiry_date     TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS voucher_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id  UUID REFERENCES vouchers(id),
    user_id     UUID REFERENCES users(id),
    order_id    UUID REFERENCES orders(id),
    used_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PROMOTIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(200),
    discount_percent  INTEGER,
    start_date        TIMESTAMP,
    end_date          TIMESTAMP,
    status            VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS product_promotions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
    promotion_id  UUID REFERENCES promotions(id) ON DELETE CASCADE
);

-- ─── PAYMENT GATEWAYS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_gateways (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE,
    is_enabled  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_gateway_config (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway       VARCHAR(50),
    config_key    VARCHAR(100),
    config_value  TEXT,
    CONSTRAINT pgc_unique UNIQUE (gateway, config_key)
);

-- ─── SEED: Payment Gateways ─────────────────────────────────
INSERT INTO payment_gateways (name, is_enabled) VALUES
    ('stripe',    true),
    ('senangpay', true),
    ('billplz',   true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
--  After running this script, create the admin user by running:
--    cd backend && node scripts/create_admin.js
-- ============================================================
