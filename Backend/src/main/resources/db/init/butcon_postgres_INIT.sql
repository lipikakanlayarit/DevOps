-- =========================================================
--  butcon_postgres_INIT.sql  (FULL, idempotent)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===================
-- USERS
-- ===================
CREATE TABLE IF NOT EXISTS users (
                                     user_id SERIAL PRIMARY KEY,
                                     email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    id_card_passport VARCHAR(50),
    roles VARCHAR(20) NOT NULL
    );

-- ===================
-- ORGANIZERS
-- ===================
CREATE TABLE IF NOT EXISTS organizers (
                                          organizer_id SERIAL PRIMARY KEY,
                                          email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    company_name TEXT,
    tax_id VARCHAR(50),
    verification_status VARCHAR(20)
    );

-- ===================
-- ADMIN_USERS
-- ===================
CREATE TABLE IF NOT EXISTS admin_users (
                                           admin_id SERIAL PRIMARY KEY,
                                           email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
    );

-- ===================
-- CATEGORIES
-- ===================
CREATE TABLE IF NOT EXISTS categories (
                                          category_id SERIAL PRIMARY KEY,
                                          category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
    );

-- ===================
-- EVENTS
-- ===================
CREATE TABLE IF NOT EXISTS events_nam (
                                          event_id SERIAL PRIMARY KEY,
                                          organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    venue_name VARCHAR(200),
    venue_address TEXT,
    max_capacity INT,
    status VARCHAR(50),               -- จะตั้ง DEFAULT ด้านล่าง (idempotent)
    cover_image BYTEA,
    cover_image_type VARCHAR(100),
    cover_updated_at TIMESTAMPTZ
    );

-- ตั้งค่า DEFAULT ให้ status = 'PENDING' (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='events_nam' AND column_name='status'
  ) THEN
    -- column มีอยู่แล้วด้านบน
    NULL;
END IF;

  -- ตั้ง DEFAULT
EXECUTE 'ALTER TABLE events_nam ALTER COLUMN status SET DEFAULT ''PENDING''';
EXCEPTION WHEN others THEN
  -- เผื่อ ALTER ซ้ำไม่เป็นไร
  NULL;
END$$;

-- เติมค่าให้แถวเดิมที่ยัง status เป็น NULL
UPDATE events_nam SET status = 'PENDING' WHERE status IS NULL;

-- (ทางเลือก) บังคับค่าให้ถูกต้องด้วย CHECK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='events_nam' AND constraint_name='events_status_check'
  ) THEN
ALTER TABLE events_nam
    ADD CONSTRAINT events_status_check
        CHECK (status IN ('PENDING','APPROVED','REJECTED','PUBLISHED'));
END IF;
END$$;

-- เผื่อฐานเดิมยังไม่มีคอลัมน์รูป
ALTER TABLE events_nam
    ADD COLUMN IF NOT EXISTS cover_image BYTEA,
    ADD COLUMN IF NOT EXISTS cover_image_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cover_updated_at TIMESTAMPTZ;

-- Generated columns (อ่านข้อมูลเบา ๆ)
ALTER TABLE events_nam
    ADD COLUMN IF NOT EXISTS cover_image_bytes INT
    GENERATED ALWAYS AS (octet_length(cover_image)) STORED,
    ADD COLUMN IF NOT EXISTS cover_image_sha1 TEXT
    GENERATED ALWAYS AS (
    CASE WHEN cover_image IS NULL THEN NULL
    ELSE encode(digest(cover_image, 'sha1'), 'hex')
    END
    ) STORED;

-- ===================
-- TICKET TYPES
-- ===================
CREATE TABLE IF NOT EXISTS ticket_types (
                                            ticket_type_id SERIAL PRIMARY KEY,
                                            event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    type_name VARCHAR(100),
    description TEXT,
    price NUMERIC(10,2),
    quantity_available INT,
    quantity_sold INT DEFAULT 0,
    sale_start_datetime TIMESTAMPTZ,
    sale_end_datetime TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    -- Advanced Setting (ต่อออเดอร์)
    min_per_order INT,
    max_per_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

-- เผื่อฐานเดิมยังไม่มีคอลัมน์เหล่านี้
ALTER TABLE ticket_types
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS min_per_order INT,
    ADD COLUMN IF NOT EXISTS max_per_order INT;

UPDATE ticket_types
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    min_per_order = COALESCE(min_per_order, 1),
    max_per_order = COALESCE(max_per_order, 1);

-- ===================
-- RESERVED / PAYMENTS
-- ===================
CREATE TABLE IF NOT EXISTS reserved (
                                        reserved_id SERIAL PRIMARY KEY,
                                        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    ticket_type_id INT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity INT,
    total_amount NUMERIC(10,2),
    payment_status VARCHAR(50),
    confirmation_code VARCHAR(100),
    notes TEXT
    );

CREATE TABLE IF NOT EXISTS payments (
                                        payment_id SERIAL PRIMARY KEY,
                                        reserved_id INT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    amount NUMERIC(10,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_status VARCHAR(50),
    gateway_response TEXT
    );

-- ===================
-- SESSIONS
-- ===================
CREATE TABLE IF NOT EXISTS organizer_sessions (
                                                  session_id VARCHAR(100) PRIMARY KEY,
    organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

CREATE TABLE IF NOT EXISTS user_sessions (
                                             session_id VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

-- ===================
-- SEATING STRUCTURE
-- ===================
CREATE TABLE IF NOT EXISTS seat_zones (
                                          zone_id SERIAL PRIMARY KEY,
                                          event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    zone_code VARCHAR(50),
    zone_name VARCHAR(100),
    row_start INT,
    row_end INT,
    price NUMERIC(10,2),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS seat_rows (
                                         row_id SERIAL PRIMARY KEY,
                                         zone_id INT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    row_label VARCHAR(10),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS seats (
                                     seat_id SERIAL PRIMARY KEY,
                                     row_id INT REFERENCES seat_rows(row_id) ON DELETE CASCADE,
    seat_number INT,
    seat_label VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS reserved_seats (
                                              reserved_seat_id SERIAL PRIMARY KEY,
                                              reserved_id INT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    seat_id INT REFERENCES seats(seat_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS seat_locks (
                                          lock_id SERIAL PRIMARY KEY,
                                          seat_id INT REFERENCES seats(seat_id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
    );

CREATE TABLE IF NOT EXISTS zone_ticket_types (
                                                 id SERIAL PRIMARY KEY,
                                                 zone_id INT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    ticket_type_id INT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
    );

-- ===== Trigger function (shared) =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at') THEN
    CREATE OR REPLACE FUNCTION tg_set_updated_at()
    RETURNS trigger AS $f$
BEGIN
      NEW.updated_at := NOW();
RETURN NEW;
END;
    $f$ LANGUAGE plpgsql;
END IF;
END$$;

-- ===== Triggers =====
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ticket_types_set_updated_at') THEN
CREATE TRIGGER trg_ticket_types_set_updated_at
    BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seat_zones_set_updated_at') THEN
CREATE TRIGGER trg_seat_zones_set_updated_at
    BEFORE UPDATE ON seat_zones
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seat_rows_set_updated_at') THEN
CREATE TRIGGER trg_seat_rows_set_updated_at
    BEFORE UPDATE ON seat_rows
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seats_set_updated_at') THEN
CREATE TRIGGER trg_seats_set_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;
END$$;

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_seat_zones_event_id ON seat_zones(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_rows_zone_id   ON seat_rows(zone_id);
CREATE INDEX IF NOT EXISTS idx_seats_row_id        ON seats(row_id);

-- ===================
-- VIEW: อ่าน events เบา ๆ
-- ===================
CREATE OR REPLACE VIEW events_nam_pretty AS
SELECT
    event_id,
    organizer_id,
    event_name,
    description,
    category_id,
    start_datetime,
    end_datetime,
    venue_name,
    venue_address,
    max_capacity,
    status,
    cover_image_bytes,
    cover_image_type,
    cover_updated_at,
    cover_image_sha1
FROM events_nam;

GRANT SELECT ON events_nam_pretty TO PUBLIC;

-- ===================
-- SEED DATA
-- ===================
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles)
VALUES
    ('alice@example.com','alice123', crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123','USER'),
    ('admin@example.com','admin', crypt('password123', gen_salt('bf', 10)),'Admin','User','0812345678','1234567890123','ADMIN'),
    ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'Organizer','User','0812345678','1234567890123','ORGANIZER'),
    ('bob@example.com','bob456', crypt('password123', gen_salt('bf', 10)),'Bob','Tan','0823456789','9876543210123','USER')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status)
VALUES
    ('org1@butcon.com','organizer',  crypt('password123', gen_salt('bf', 10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
    ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf', 10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active)
VALUES ('admin@butcon.com','admin', crypt('password123', gen_salt('bf', 10)), 'System','Admin','SUPERADMIN', TRUE)
    ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name, description) VALUES
                                                        ('Concert','Music concerts and live shows'),
                                                        ('Seminar','Business and academic seminars'),
                                                        ('Exhibition','Outdoor and cultural Exhibition')
    ON CONFLICT DO NOTHING;

-- Seed events → ให้เป็น PENDING ตามกติกา
INSERT INTO events_nam (
    organizer_id, event_name, description, category_id,
    start_datetime, end_datetime, venue_name, venue_address,
    max_capacity, status
) VALUES
      (1,'BUTCON Music Fest 2025','Annual outdoor music festival',1,
       TIMESTAMPTZ '2025-11-01 18:00:00+07', TIMESTAMPTZ '2025-11-01 23:59:59+07',
       'Central Park','Bangkok, Thailand',5000,'PENDING'),
      (2,'Startup Seminar 2025','Seminar for startups and investors',2,
       TIMESTAMPTZ '2025-10-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 17:00:00+07',
       'Chiang Mai Conference Center','Chiang Mai, Thailand',300,'PENDING')
    ON CONFLICT DO NOTHING;

INSERT INTO ticket_types (
    event_id, type_name, description, price, quantity_available, quantity_sold,
    sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order
) VALUES
      (1,'General Admission','Standard entry ticket',1500.00,3000,100,
       TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE, 1, 10),
      (1,'VIP','VIP access with perks',5000.00,500,50,
       TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE, 1, 5),
      (2,'Seminar Pass','Full-day seminar pass',1000.00,200,20,
       TIMESTAMPTZ '2025-08-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 09:00:00+07', TRUE, 1, 4)
    ON CONFLICT DO NOTHING;

INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes)
VALUES
    (1,1,1,2,3000.00,'PAID','CONF123ABC','Excited to join!'),
    (2,1,2,1,5000.00,'PENDING','CONF456DEF','Need invoice'),
    (1,2,3,1,1000.00,'PAID','CONF789GHI','Business trip covered')
    ON CONFLICT DO NOTHING;

INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response)
VALUES
    (1,3000.00,'Credit Card','TXN123','SUCCESS','Approved by gateway'),
    (2,5000.00,'Bank Transfer','TXN456','PENDING',NULL),
    (3,1000.00,'E-Wallet','TXN789','SUCCESS','Wallet confirmed')
    ON CONFLICT DO NOTHING;

INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES ('sess_org1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.10','Mozilla/5.0')
    ON CONFLICT DO NOTHING;

INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES
    ('sess_user1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.11','Mozilla/5.0'),
    ('sess_user2',2,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.12','Chrome/120.0')
    ON CONFLICT DO NOTHING;

-- =========================================================
-- End of file
-- =========================================================
