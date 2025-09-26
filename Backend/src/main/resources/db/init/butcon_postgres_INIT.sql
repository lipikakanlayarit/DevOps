-- =========================================================
-- BUTCON: ONE-SHOT INIT (PostgreSQL 14+)
-- Full schema + seed with real BCrypt using pgcrypto
-- =========================================================

SET client_encoding = 'UTF8';
SET TIME ZONE 'Asia/Bangkok';
SET search_path TO public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- drop (dev only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'v_seat_status') THEN
    EXECUTE 'DROP VIEW IF EXISTS v_seat_status CASCADE';
END IF;
END$$;

DROP TRIGGER IF EXISTS trg_after_payment_success ON payments;
DROP FUNCTION IF EXISTS trg_after_payment_success_fn() CASCADE;
DROP PROCEDURE IF EXISTS create_zone_with_grid(BIGINT, VARCHAR, INT, INT, BIGINT);
DROP FUNCTION IF EXISTS index_to_letters(INT);

DROP TABLE IF EXISTS reserved_seats       CASCADE;
DROP TABLE IF EXISTS seat_locks           CASCADE;
DROP TABLE IF EXISTS zone_ticket_types    CASCADE;
DROP TABLE IF EXISTS seats                CASCADE;
DROP TABLE IF EXISTS seat_rows            CASCADE;
DROP TABLE IF EXISTS seat_zones           CASCADE;
DROP TABLE IF EXISTS payments             CASCADE;
DROP TABLE IF EXISTS reserved             CASCADE;
DROP TABLE IF EXISTS ticket_types         CASCADE;
DROP TABLE IF EXISTS events_nam           CASCADE;
DROP TABLE IF EXISTS categories           CASCADE;
DROP TABLE IF EXISTS user_sessions        CASCADE;
DROP TABLE IF EXISTS organizer_sessions   CASCADE;
DROP TABLE IF EXISTS admin_users          CASCADE;
DROP TABLE IF EXISTS organizers           CASCADE;
DROP TABLE IF EXISTS users                CASCADE;

-- users / organizers / admins
CREATE TABLE users (
                       user_id BIGSERIAL PRIMARY KEY,
                       username VARCHAR(255) UNIQUE NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100) NOT NULL,
                       last_name  VARCHAR(100) NOT NULL,
                       phone_number VARCHAR(20),
                       id_card_passport VARCHAR(20),
                       roles VARCHAR(50) NOT NULL DEFAULT 'USER',
                       created_at TIMESTAMPTZ DEFAULT NOW(),
                       updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE organizers (
                            organizer_id BIGSERIAL PRIMARY KEY,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            password_hash VARCHAR(255) NOT NULL,
                            first_name VARCHAR(100) NOT NULL,
                            last_name  VARCHAR(100) NOT NULL,
                            phone_number VARCHAR(20),
                            address TEXT,
                            company_name VARCHAR(255),
                            tax_id VARCHAR(50),
                            verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_organizers_email ON organizers(email);
CREATE INDEX idx_organizers_verification_status ON organizers(verification_status);

CREATE TABLE admin_users (
                             admin_id BIGSERIAL PRIMARY KEY,
                             email VARCHAR(255) UNIQUE NOT NULL,
                             password_hash VARCHAR(255) NOT NULL,
                             first_name VARCHAR(100) NOT NULL,
                             last_name  VARCHAR(100) NOT NULL,
                             role_name VARCHAR(50) DEFAULT 'ADMIN',
                             is_active BOOLEAN DEFAULT TRUE,
                             created_at TIMESTAMPTZ DEFAULT NOW(),
                             updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- categories / events
CREATE TABLE categories (
                            category_id SERIAL PRIMARY KEY,
                            category_name VARCHAR(100) NOT NULL,
                            description TEXT,
                            is_active BOOLEAN DEFAULT TRUE,
                            created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_name ON categories(category_name);

CREATE TABLE events_nam (
                            event_id BIGSERIAL PRIMARY KEY,
                            organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
                            event_name VARCHAR(255) NOT NULL,
                            description TEXT,
                            category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
                            start_datetime TIMESTAMPTZ NOT NULL,
                            end_datetime   TIMESTAMPTZ NOT NULL,
                            venue_name VARCHAR(255) NOT NULL,
                            venue_address TEXT,
                            cover_image_url VARCHAR(500),
                            max_capacity INT DEFAULT 0,
                            status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','PUBLISHED')),
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_organizer ON events_nam(organizer_id);
CREATE INDEX idx_events_category  ON events_nam(category_id);
CREATE INDEX idx_events_status    ON events_nam(status);
CREATE INDEX idx_events_start_date ON events_nam(start_datetime);

CREATE INDEX idx_events_search
    ON events_nam USING GIN (to_tsvector('simple', coalesce(event_name,'') || ' ' || coalesce(description,'')));

-- ticket types
CREATE TABLE ticket_types (
                              ticket_type_id BIGSERIAL PRIMARY KEY,
                              event_id BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
                              type_name VARCHAR(100) NOT NULL,
                              description TEXT,
                              price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
                              quantity_available INT NOT NULL DEFAULT 0,
                              quantity_sold INT DEFAULT 0,
                              sale_start_datetime TIMESTAMPTZ,
                              sale_end_datetime   TIMESTAMPTZ,
                              is_active BOOLEAN DEFAULT TRUE,
                              created_at TIMESTAMPTZ DEFAULT NOW(),
                              updated_at TIMESTAMPTZ DEFAULT NOW(),
                              CONSTRAINT chk_quantity CHECK (quantity_sold <= quantity_available),
                              CONSTRAINT chk_price CHECK (price >= 0)
);
CREATE INDEX idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_active ON ticket_types(is_active);

-- reserved
CREATE TABLE reserved (
                          reserved_id BIGSERIAL PRIMARY KEY,
                          user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                          event_id BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
                          ticket_type_id BIGINT NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
                          quantity INT NOT NULL DEFAULT 1,
                          total_amount NUMERIC(10,2) NOT NULL,
                          payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID')),
                          registration_datetime TIMESTAMPTZ DEFAULT NOW(),
                          payment_datetime TIMESTAMPTZ NULL,
                          confirmation_code VARCHAR(50) UNIQUE,
                          notes TEXT
);
CREATE INDEX idx_reserved_user ON reserved(user_id);
CREATE INDEX idx_reserved_event ON reserved(event_id);
CREATE INDEX idx_reserved_ticket_type ON reserved(ticket_type_id);
CREATE INDEX idx_reserved_confirmation ON reserved(confirmation_code);
CREATE INDEX idx_reserved_payment_status ON reserved(payment_status);

-- payments
CREATE TABLE payments (
                          payment_id BIGSERIAL PRIMARY KEY,
                          reserved_id BIGINT NOT NULL REFERENCES reserved(reserved_id) ON DELETE CASCADE,
                          amount NUMERIC(10,2) NOT NULL,
                          payment_method VARCHAR(50) NOT NULL,
                          transaction_id VARCHAR(100),
                          payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','SUCCESS','FAILED')),
                          payment_datetime TIMESTAMPTZ DEFAULT NOW(),
                          gateway_response TEXT
);
CREATE INDEX idx_payments_reserved ON payments(reserved_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- sessions
CREATE TABLE organizer_sessions (
                                    session_id VARCHAR(128) PRIMARY KEY,
                                    organizer_id BIGINT NOT NULL REFERENCES organizers(organizer_id) ON DELETE CASCADE,
                                    created_at TIMESTAMPTZ DEFAULT NOW(),
                                    expires_at TIMESTAMPTZ NOT NULL,
                                    is_active BOOLEAN DEFAULT TRUE,
                                    last_activity TIMESTAMPTZ DEFAULT NOW(),
                                    ip_address VARCHAR(45),
                                    user_agent TEXT
);
CREATE INDEX idx_organizer_sessions_organizer ON organizer_sessions(organizer_id);
CREATE INDEX idx_organizer_sessions_expires ON organizer_sessions(expires_at);
CREATE INDEX idx_organizer_sessions_active ON organizer_sessions(is_active);

CREATE TABLE user_sessions (
                               session_id VARCHAR(128) PRIMARY KEY,
                               user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                               created_at TIMESTAMPTZ DEFAULT NOW(),
                               expires_at TIMESTAMPTZ NOT NULL,
                               is_active BOOLEAN DEFAULT TRUE,
                               last_activity TIMESTAMPTZ DEFAULT NOW(),
                               ip_address VARCHAR(45),
                               user_agent TEXT
);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

-- seating
CREATE TABLE seat_zones (
                            zone_id     BIGSERIAL PRIMARY KEY,
                            event_id    BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
                            zone_name   VARCHAR(100) NOT NULL,
                            description TEXT,
                            sort_order  INT DEFAULT 0,
                            is_active   BOOLEAN DEFAULT TRUE,
                            created_at  TIMESTAMPTZ DEFAULT NOW(),
                            updated_at  TIMESTAMPTZ DEFAULT NOW(),
                            CONSTRAINT uk_event_zone_name UNIQUE (event_id, zone_name)
);

CREATE TABLE seat_rows (
                           row_id     BIGSERIAL PRIMARY KEY,
                           zone_id    BIGINT NOT NULL REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
                           row_label  VARCHAR(10) NOT NULL,
                           sort_order INT DEFAULT 0,
                           created_at TIMESTAMPTZ DEFAULT NOW(),
                           updated_at TIMESTAMPTZ DEFAULT NOW(),
                           CONSTRAINT uk_zone_rowlabel UNIQUE (zone_id, row_label)
);

CREATE TABLE seats (
                       seat_id     BIGSERIAL PRIMARY KEY,
                       row_id      BIGINT NOT NULL REFERENCES seat_rows(row_id) ON DELETE CASCADE,
                       seat_number INT NOT NULL,
                       seat_label  VARCHAR(32) NOT NULL,
                       is_active   BOOLEAN DEFAULT TRUE,
                       created_at TIMESTAMPTZ DEFAULT NOW(),
                       updated_at TIMESTAMPTZ DEFAULT NOW(),
                       CONSTRAINT uk_row_seatnum UNIQUE (row_id, seat_number),
                       CONSTRAINT uk_seat_label UNIQUE (row_id, seat_label)
);

CREATE TABLE zone_ticket_types (
                                   zone_id        BIGINT NOT NULL REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
                                   ticket_type_id BIGINT NOT NULL REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
                                   PRIMARY KEY (zone_id, ticket_type_id)
);

CREATE TABLE seat_locks (
                            lock_id    BIGSERIAL PRIMARY KEY,
                            seat_id    BIGINT NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE,
                            event_id   BIGINT NOT NULL REFERENCES events_nam(event_id) ON DELETE CASCADE,
                            user_id    BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
                            started_at TIMESTAMPTZ DEFAULT NOW(),
                            expires_at TIMESTAMPTZ NOT NULL,
                            status     TEXT DEFAULT 'HELD' CHECK (status IN ('HELD','RELEASED','EXPIRED'))
);
CREATE INDEX idx_seat_locks_seat ON seat_locks(seat_id, event_id, status);
CREATE INDEX idx_seat_locks_expires ON seat_locks(expires_at);

CREATE TABLE reserved_seats (
                                reserved_id BIGINT NOT NULL REFERENCES reserved(reserved_id) ON DELETE CASCADE,
                                seat_id     BIGINT NOT NULL REFERENCES seats(seat_id) ON DELETE RESTRICT,
                                PRIMARY KEY (reserved_id, seat_id),
                                CONSTRAINT uk_seat_once UNIQUE (seat_id)
);

-- triggers / funcs
CREATE OR REPLACE FUNCTION trg_after_payment_success_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'SUCCESS' AND (OLD.payment_status IS DISTINCT FROM 'SUCCESS') THEN
UPDATE ticket_types tt
SET quantity_sold = tt.quantity_sold + r.quantity,
    updated_at = NOW()
    FROM reserved r
WHERE r.reserved_id = NEW.reserved_id
  AND tt.ticket_type_id = r.ticket_type_id;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_payment_success
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_after_payment_success_fn();

CREATE OR REPLACE FUNCTION index_to_letters(n INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
s TEXT := '';
  x INT := n + 1;
BEGIN
  WHILE x > 0 LOOP
    x := x - 1;
    s := chr(65 + (x % 26)) || s;
    x := x / 26;
END LOOP;
RETURN s;
END;
$$;

CREATE OR REPLACE PROCEDURE create_zone_with_grid (
  p_event_id BIGINT,
  p_zone_name VARCHAR(100),
  p_rows INT,
  p_seats_per_row INT,
  p_ticket_type_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
v_zone BIGINT;
  v_row_id BIGINT;
  r INT := 0;
  s INT;
  v_label TEXT;
BEGIN
INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active)
VALUES (p_event_id, p_zone_name, 'Auto generated ' || NOW()::text, 0, TRUE)
    RETURNING zone_id INTO v_zone;

WHILE r < p_rows LOOP
    v_label := index_to_letters(r);
INSERT INTO seat_rows (zone_id, row_label, sort_order)
VALUES (v_zone, v_label, r)
    RETURNING row_id INTO v_row_id;

s := 1;
    WHILE s <= p_seats_per_row LOOP
      INSERT INTO seats (row_id, seat_number, seat_label, is_active)
      VALUES (v_row_id, s, v_label || s::text, TRUE);
      s := s + 1;
END LOOP;

    r := r + 1;
END LOOP;

  IF p_ticket_type_id IS NOT NULL THEN
    INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
    VALUES (v_zone, p_ticket_type_id)
    ON CONFLICT DO NOTHING;
END IF;
END;
$$;

-- seed (BCrypt via pgcrypto) — NOTE: users column 'roles' (not 'role')
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles)
VALUES
    ('alice@example.com','alice123', crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123', 'USER'),
    ('admin@example.com','admin', crypt('password123', gen_salt('bf', 10)),'admin','user','0812345678','1234567890123', 'ADMIN'),
    ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'organizer','user','0812345678','1234567890123', 'ORGANIZER'),
    ('bob@example.com','bob456',     crypt('password123', gen_salt('bf', 10)),'Bob','Tan','0823456789','9876543210123', 'USER')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO organizers (email, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status)
VALUES
    ('org1@butcon.com', crypt('password123', gen_salt('bf', 10)), 'Nina', 'Lee', '0834567890', 'Bangkok, TH', 'EventPro Ltd.',   'TAX123456', 'VERIFIED'),
    ('org2@butcon.com', crypt('password123', gen_salt('bf', 10)), 'John', 'Chan','0845678901', 'Chiang Mai, TH', 'ConcertHub Co.', 'TAX654321', 'VERIFIED')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO admin_users (email, password_hash, first_name, last_name, role_name, is_active)
VALUES ('admin@butcon.com', crypt('password123', gen_salt('bf', 10)), 'System', 'Admin', 'SUPERADMIN', TRUE)
    ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name, description) VALUES
                                                        ('Concert',  'Music concerts and live shows'),
                                                        ('Seminar',  'Business and academic seminars'),
                                                        ('Festival', 'Outdoor and cultural festivals')
    ON CONFLICT DO NOTHING;

INSERT INTO events_nam (organizer_id, event_name, description, category_id, start_datetime, end_datetime, venue_name, venue_address, max_capacity, status) VALUES
                                                                                                                                                               (1, 'BUTCON Music Fest 2025', 'Annual outdoor music festival', 1, TIMESTAMPTZ '2025-11-01 18:00:00+07', TIMESTAMPTZ '2025-11-01 23:59:59+07', 'Central Park', 'Bangkok, Thailand', 5000, 'PUBLISHED'),
                                                                                                                                                               (2, 'Startup Seminar 2025',   'Seminar for startups and investors', 2, TIMESTAMPTZ '2025-10-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 17:00:00+07', 'Chiang Mai Conference Center', 'Chiang Mai, Thailand', 300, 'PUBLISHED')
    ON CONFLICT DO NOTHING;

INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold, sale_start_datetime, sale_end_datetime, is_active) VALUES
                                                                                                                                                             (1, 'General Admission', 'Standard entry ticket', 1500.00, 3000, 100, TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE),
                                                                                                                                                             (1, 'VIP',               'VIP access with perks', 5000.00,  500,  50, TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE),
                                                                                                                                                             (2, 'Seminar Pass',      'Full-day seminar pass', 1000.00,  200,  20, TIMESTAMPTZ '2025-08-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 09:00:00+07', TRUE)
    ON CONFLICT DO NOTHING;

INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes) VALUES
                                                                                                                               (1, 1, 1, 2, 3000.00, 'PAID',   'CONF123ABC', 'Excited to join!'),
                                                                                                                               (2, 1, 2, 1, 5000.00, 'PENDING','CONF456DEF', 'Need invoice'),
                                                                                                                               (1, 2, 3, 1, 1000.00, 'PAID',   'CONF789GHI', 'Business trip covered')
    ON CONFLICT DO NOTHING;

INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response) VALUES
                                                                                                                 (1, 3000.00, 'Credit Card',  'TXN123', 'SUCCESS', 'Approved by gateway'),
                                                                                                                 (2, 5000.00, 'Bank Transfer','TXN456', 'PENDING', NULL),
                                                                                                                 (3, 1000.00, 'E-Wallet',     'TXN789', 'SUCCESS', 'Wallet confirmed')
    ON CONFLICT DO NOTHING;

INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES ('sess_org1', 1, NOW(), NOW() + INTERVAL '1 day', TRUE, '192.168.1.10', 'Mozilla/5.0')
    ON CONFLICT DO NOTHING;

INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
                                                                                                               ('sess_user1', 1, NOW(), NOW() + INTERVAL '1 day', TRUE, '192.168.1.11', 'Mozilla/5.0'),
                                                                                                               ('sess_user2', 2, NOW(), NOW() + INTERVAL '1 day', TRUE, '192.168.1.12', 'Chrome/120.0')
    ON CONFLICT DO NOTHING;

-- demo seat grid (optional):
-- CALL create_zone_with_grid(1, 'VIP',     10, 12, 2);
-- CALL create_zone_with_grid(1, 'REGULAR', 30, 20, 1);
