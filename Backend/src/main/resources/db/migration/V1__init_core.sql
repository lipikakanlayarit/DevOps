-- V1__init_core.sql
-- PostgreSQL core schema (converted from MySQL)
-- Notes:
-- - BIGSERIAL for auto-increment
-- - ENUMs replaced by VARCHAR with CHECK constraints
-- - updated_at handled by triggers in V2
-- - All FK constraints are explicit with ON DELETE behavior

-- 0) session settings (optional safety)
SET TIME ZONE '+07:00';

-- 1) USERS / ORGANIZERS / ADMINS ---------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    id_card_passport VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS organizers (
    organizer_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    verification_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_organizer_verification_status CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_organizers_verification_status ON organizers(verification_status);

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 2) CATEGORIES / EVENTS -----------------------------------
CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);

CREATE TABLE IF NOT EXISTS events_nam (
    event_id BIGSERIAL PRIMARY KEY,
    organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id BIGINT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime   TIMESTAMPTZ NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    cover_image_url VARCHAR(500),
    max_capacity INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_events_status CHECK (status IN ('PENDING','PUBLISHED'))
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events_nam(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category  ON events_nam(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status    ON events_nam(status);
CREATE INDEX IF NOT EXISTS idx_events_start     ON events_nam(start_datetime);

-- 3) TICKET TYPES ------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_types (
    ticket_type_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_sold INT NOT NULL DEFAULT 0,
    sale_start_datetime TIMESTAMPTZ,
    sale_end_datetime   TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ticket_quantity CHECK (quantity_sold <= quantity_available),
    CONSTRAINT chk_ticket_price CHECK (price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event  ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_active ON ticket_types(is_active);

-- 4) RESERVED -----------------------------------------------
CREATE TABLE IF NOT EXISTS reserved (
    reserved_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
    ticket_type_id BIGINT NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    registration_datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_datetime TIMESTAMPTZ,
    confirmation_code VARCHAR(50) UNIQUE,
    notes TEXT,
    CONSTRAINT chk_reserved_qty_positive CHECK (quantity > 0),
    CONSTRAINT chk_reserved_amt_positive CHECK (total_amount >= 0),
    CONSTRAINT chk_reserved_payment_status CHECK (payment_status IN ('PENDING','PAID'))
);
CREATE INDEX IF NOT EXISTS idx_reserved_user          ON reserved(user_id);
CREATE INDEX IF NOT EXISTS idx_reserved_event         ON reserved(event_id);
CREATE INDEX IF NOT EXISTS idx_reserved_ticket_type   ON reserved(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_reserved_confirmation  ON reserved(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reserved_payment_status ON reserved(payment_status);

-- 5) PAYMENTS -----------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGSERIAL PRIMARY KEY,
    reserved_id BIGINT NOT NULL REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100),
    payment_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    payment_datetime TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gateway_response TEXT,
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING','SUCCESS','FAILED'))
);
CREATE INDEX IF NOT EXISTS idx_payments_reserved    ON payments(reserved_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(payment_status);

-- 6) SESSIONS -----------------------------------------------
CREATE TABLE IF NOT EXISTS organizer_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_org_sessions_organizer ON organizer_sessions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_org_sessions_expires   ON organizer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_org_sessions_active    ON organizer_sessions(is_active);

CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user    ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active  ON user_sessions(is_active);

-- SEATING MODEL ---------------------------------------------
CREATE TABLE IF NOT EXISTS seat_zones (
  zone_id     BIGSERIAL PRIMARY KEY,
  event_id    BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
  zone_name   VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_event_zone_name UNIQUE (event_id, zone_name)
);

CREATE TABLE IF NOT EXISTS seat_rows (
  row_id     BIGSERIAL PRIMARY KEY,
  zone_id    BIGINT NOT NULL REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  row_label  VARCHAR(10) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_zone_rowlabel UNIQUE (zone_id, row_label)
);

CREATE TABLE IF NOT EXISTS seats (
  seat_id     BIGSERIAL PRIMARY KEY,
  row_id      BIGINT NOT NULL REFERENCES seat_rows(row_id) ON DELETE CASCADE,
  seat_number INT NOT NULL,
  seat_label  VARCHAR(32) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_row_seatnum UNIQUE (row_id, seat_number),
  CONSTRAINT uk_row_seatlabel UNIQUE (row_id, seat_label)
);

CREATE TABLE IF NOT EXISTS zone_ticket_types (
  zone_id        BIGINT NOT NULL REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  ticket_type_id BIGINT NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
  PRIMARY KEY (zone_id, ticket_type_id)
);

CREATE TABLE IF NOT EXISTS seat_locks (
  lock_id    BIGSERIAL PRIMARY KEY,
  seat_id    BIGINT NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE,
  event_id   BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
  user_id    BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  status     VARCHAR(16) NOT NULL DEFAULT 'HELD',
  CONSTRAINT chk_lock_status CHECK (status IN ('HELD','RELEASED','EXPIRED'))
);
CREATE INDEX IF NOT EXISTS idx_lock_seat ON seat_locks(seat_id, event_id, status);
CREATE INDEX IF NOT EXISTS idx_lock_exp  ON seat_locks(expires_at);

CREATE TABLE IF NOT EXISTS reserved_seats (
  reserved_id BIGINT NOT NULL REFERENCES reserved(reserved_id) ON DELETE CASCADE,
  seat_id     BIGINT NOT NULL REFERENCES seats(seat_id) ON DELETE RESTRICT,
  PRIMARY KEY (reserved_id, seat_id),
  CONSTRAINT uk_reserved_seat UNIQUE (seat_id)
);
