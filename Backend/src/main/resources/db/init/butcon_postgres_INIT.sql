-- =========================================
-- BUTCON INITIAL SCHEMA & SEED (ONE FILE)
-- =========================================

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Core tables
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(30),
  id_card_passport VARCHAR(30),
  roles VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS organizers (
  organizer_id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(30),
  address TEXT,
  company_name VARCHAR(150),
  tax_id VARCHAR(50),
  verification_status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS admin_users (
  admin_id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_name VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS events_nam (
  event_id SERIAL PRIMARY KEY,
  organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
  event_name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  venue_name VARCHAR(200),
  venue_address VARCHAR(255),
  max_capacity INT,
  status VARCHAR(50)
);

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
  is_active BOOLEAN DEFAULT TRUE
);

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

-- unique index/constraint needed by inserts with ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ux_reserved_confirmation_code'
  ) THEN
    ALTER TABLE reserved
      ADD CONSTRAINT ux_reserved_confirmation_code UNIQUE (confirmation_code);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  reserved_id INT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
  amount NUMERIC(10,2),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  payment_status VARCHAR(50),
  gateway_response TEXT
);

CREATE TABLE IF NOT EXISTS organizer_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255)
);

-- 2) Seating tables
CREATE TABLE IF NOT EXISTS seat_zones (
  zone_id BIGSERIAL PRIMARY KEY,
  event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
  zone_name VARCHAR(255),
  description VARCHAR(255),
  sort_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_zone_event ON seat_zones(event_id);

CREATE TABLE IF NOT EXISTS seat_rows (
  row_id BIGSERIAL PRIMARY KEY,
  zone_id BIGINT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  row_label VARCHAR(255),
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_row_zone_label ON seat_rows(zone_id, row_label);

CREATE TABLE IF NOT EXISTS seats (
  seat_id BIGSERIAL PRIMARY KEY,
  row_id BIGINT REFERENCES seat_rows(row_id) ON DELETE CASCADE,
  seat_label VARCHAR(255),
  seat_number INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_seat_row_number ON seats(row_id, seat_number);

CREATE TABLE IF NOT EXISTS reserved_seats (
  reserved_id BIGINT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
  seat_id BIGINT REFERENCES seats(seat_id) ON DELETE CASCADE,
  PRIMARY KEY (reserved_id, seat_id)
);

CREATE TABLE IF NOT EXISTS seat_locks (
  lock_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  event_id BIGINT,
  seat_id BIGINT,
  status VARCHAR(255),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zone_ticket_types (
  ticket_type_id BIGINT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
  zone_id BIGINT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_type_id, zone_id)
);

ALTER TABLE reserved
  ADD COLUMN IF NOT EXISTS registration_datetime timestamptz;

-- (ออปชัน) ตั้งค่า default เผื่อ insert โดยไม่ส่งค่า
ALTER TABLE reserved
  ALTER COLUMN registration_datetime SET DEFAULT NOW();


-- =========================================
-- 3) Base seed data
-- =========================================

-- Users
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles) VALUES
  ('alice@example.com','alice123', crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123','USER'),
  ('admin@example.com','admin',    crypt('password123', gen_salt('bf', 10)),'admin','user','0812345678','1234567890123','ADMIN'),
  ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'organizer','user','0812345678','1234567890123','ORGANIZER'),
  ('bob@example.com','bob456',     crypt('password123', gen_salt('bf', 10)),'Bob','Tan','0823456789','9876543210123','USER')
ON CONFLICT (email) DO NOTHING;

-- Organizers
INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status) VALUES
  ('org1@butcon.com','organizer',  crypt('password123', gen_salt('bf', 10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
  ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf', 10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
ON CONFLICT (email) DO NOTHING;

-- Admins
INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active) VALUES
  ('admin@butcon.com','admin', crypt('password123', gen_salt('bf', 10)), 'System','Admin','SUPERADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (category_name, description) VALUES
  ('Concert','Music concerts and live shows'),
  ('Seminar','Business and academic seminars'),
  ('Festival','Outdoor and cultural festivals')
ON CONFLICT DO NOTHING;

-- Events (10)
INSERT INTO events_nam (organizer_id, event_name, description, category_id, start_datetime, end_datetime, venue_name, venue_address, max_capacity, status) VALUES
  (1,'BUTCON Music Fest 2025','Annual outdoor music festival',1,'2025-11-01 18:00:00+07','2025-11-01 23:59:59+07','Central Park','Bangkok, Thailand',5000,'PUBLISHED'),
  (1,'Live at Riverfront','Night concert by indie bands',1,'2025-11-15 19:00:00+07','2025-11-15 23:00:00+07','Asiatique Stage','Bangkok, Thailand',3000,'PUBLISHED'),
  (2,'Winter Jazz Night','Smooth jazz from top artists',1,'2025-12-10 18:30:00+07','2025-12-10 22:30:00+07','Chiang Mai Night Bazaar','Chiang Mai, Thailand',800,'PUBLISHED'),
  (2,'Rockwave Reloaded','Rock music concert with 5 headline bands',1,'2026-01-05 17:00:00+07','2026-01-05 23:00:00+07','Thunder Dome','Nonthaburi, Thailand',4000,'PUBLISHED'),
  (2,'Startup Seminar 2025','Seminar for startups and investors',2,'2025-10-15 09:00:00+07','2025-10-15 17:00:00+07','Chiang Mai Conference Center','Chiang Mai, Thailand',300,'PUBLISHED'),
  (1,'AI in Business Forum','Exploring practical AI solutions',2,'2025-11-25 09:30:00+07','2025-11-25 16:30:00+07','BITEC Hall 2','Bangkok, Thailand',400,'PUBLISHED'),
  (2,'Cybersecurity Trends 2026','Protecting enterprises from future threats',2,'2026-02-12 10:00:00+07','2026-02-12 16:00:00+07','Queen Sirikit Convention Center','Bangkok, Thailand',500,'PUBLISHED'),
  (1,'Lantern Festival','Traditional floating lanterns & cultural show',3,'2025-11-20 17:00:00+07','2025-11-20 23:00:00+07','Ping River','Chiang Mai, Thailand',2000,'PUBLISHED'),
  (1,'Foodie Carnival','Street food from all over Thailand',3,'2025-12-05 15:00:00+07','2025-12-05 22:00:00+07','Impact Lakeside','Nonthaburi, Thailand',2500,'PUBLISHED'),
  (2,'Songkran Water Fest','Water celebration and EDM nights',3,'2026-04-13 14:00:00+07','2026-04-15 23:59:00+07','Silom Road','Bangkok, Thailand',8000,'PUBLISHED')
ON CONFLICT DO NOTHING;

-- Ticket types
INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold, sale_start_datetime, sale_end_datetime, is_active) VALUES
  (1,'General Admission','Standard entry ticket',1500.00,3000,120,'2025-09-01 10:00:00+07','2025-11-01 18:00:00+07',TRUE),
  (1,'VIP','VIP access with perks',5000.00,500,100,'2025-09-01 10:00:00+07','2025-11-01 18:00:00+07',TRUE),
  (2,'Standing Zone','Front-stage standing ticket',1800.00,1500,350,'2025-10-01 09:00:00+07','2025-11-15 19:00:00+07',TRUE),
  (3,'Regular Seat','Seat ticket for jazz lovers',1200.00,700,100,'2025-10-20 09:00:00+07','2025-12-10 18:00:00+07',TRUE),
  (4,'Rock Arena','All-access standing zone',2500.00,3000,500,'2025-11-10 10:00:00+07','2026-01-05 17:00:00+07',TRUE),
  (5,'Seminar Pass','Full-day seminar pass',1000.00,200,50,'2025-08-15 09:00:00+07','2025-10-15 09:00:00+07',TRUE),
  (6,'Conference Entry','Business conference admission',1200.00,400,120,'2025-09-10 09:00:00+07','2025-11-25 09:00:00+07',TRUE),
  (8,'Festival Pass','Entry for full night show',800.00,1500,200,'2025-10-10 09:00:00+07','2025-11-20 17:00:00+07',TRUE),
  (9,'Food Lover Pass','Access to all food stalls',500.00,2000,300,'2025-10-15 09:00:00+07','2025-12-05 15:00:00+07',TRUE),
  (10,'Water Zone Entry','Unlimited entry for all days',900.00,5000,800,'2026-02-01 09:00:00+07','2026-04-13 14:00:00+07',TRUE)
ON CONFLICT DO NOTHING;

-- 4) Seating plan for ALL events (Zones/Rows/Seats)
-- Each event: Zone A & B -> Rows A..E -> Seats 1..20 (200 seats / event)
DO $$
DECLARE
  v_event RECORD;
  v_zone_id BIGINT;
  v_row_id BIGINT;
  zone_names TEXT[] := ARRAY['Zone A','Zone B'];
  row_labels TEXT[] := ARRAY['A','B','C','D','E'];
  i INT;
  z TEXT;
  r TEXT;
BEGIN
  FOR v_event IN SELECT event_id FROM events_nam LOOP
    -- Zones
    FOREACH z IN ARRAY zone_names LOOP
      INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active)
      VALUES (v_event.event_id, z, 'Auto-generated seating zone',
              CASE WHEN z='Zone A' THEN 1 ELSE 2 END, TRUE)
      ON CONFLICT DO NOTHING;

      SELECT zone_id INTO v_zone_id
      FROM seat_zones
      WHERE event_id = v_event.event_id AND zone_name = z
      ORDER BY zone_id DESC
      LIMIT 1;

      -- Rows
      FOREACH r IN ARRAY row_labels LOOP
        INSERT INTO seat_rows (zone_id, row_label, sort_order)
        VALUES (v_zone_id, r,
          CASE r WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 WHEN 'E' THEN 5 END)
        ON CONFLICT DO NOTHING;

        SELECT row_id INTO v_row_id
        FROM seat_rows
        WHERE zone_id = v_zone_id AND row_label = r
        ORDER BY row_id DESC
        LIMIT 1;

        -- Seats 1..20
        FOR i IN 1..20 LOOP
          INSERT INTO seats (row_id, seat_label, seat_number, is_active)
          VALUES (v_row_id, r || '-' || i::text, i, TRUE)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- 5) Map each ticket_type to all zones of its event (simple default)
INSERT INTO zone_ticket_types (ticket_type_id, zone_id)
SELECT tt.ticket_type_id, sz.zone_id
FROM ticket_types tt
JOIN seat_zones sz ON sz.event_id = tt.event_id
ON CONFLICT DO NOTHING;

-- 6) Sample reservations
INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes) VALUES
  (1,1,1,2,3000.00,'PAID','CONF001ABC','Early bird'),
  (2,1,2,1,5000.00,'PENDING','CONF002DEF','Need invoice'),
  (3,2,3,3,5400.00,'PAID','CONF003GHI','Front row seats'),
  (2,3,4,2,2400.00,'PAID','CONF004JKL','Jazz night'),
  (4,4,5,1,2500.00,'PAID','CONF005MNO','Rockwave fan'),
  (1,5,6,1,1000.00,'PAID','CONF006PQR','Business trip'),
  (2,6,7,1,1200.00,'PAID','CONF007STU','VIP seat'),
  (3,8,8,4,3200.00,'PAID','CONF008VWX','Festival crew'),
  (1,9,9,2,1000.00,'PAID','CONF009YZA','Food fest lovers'),
  (2,10,10,5,4500.00,'PENDING','CONF010BCD','Group booking')
ON CONFLICT ON CONSTRAINT ux_reserved_confirmation_code DO NOTHING;

-- 7) Payments
INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response) VALUES
  (1,3000.00,'Credit Card','TXN001','SUCCESS','Approved by gateway'),
  (2,5000.00,'Bank Transfer','TXN002','PENDING',NULL),
  (3,5400.00,'Credit Card','TXN003','SUCCESS','Processed'),
  (4,2400.00,'E-Wallet','TXN004','SUCCESS','Wallet OK'),
  (5,2500.00,'Bank Transfer','TXN005','SUCCESS','Cleared'),
  (6,1000.00,'E-Wallet','TXN006','SUCCESS','Confirmed'),
  (7,1200.00,'Credit Card','TXN007','SUCCESS','Approved'),
  (8,3200.00,'Credit Card','TXN008','SUCCESS','Approved'),
  (9,1000.00,'E-Wallet','TXN009','SUCCESS','Paid'),
  (10,4500.00,'Bank Transfer','TXN010','PENDING',NULL)
ON CONFLICT DO NOTHING;

-- 8) Sessions (demo)
INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES ('sess_org1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.10','Mozilla/5.0')
ON CONFLICT DO NOTHING;

INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
  ('sess_user1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.11','Mozilla/5.0'),
  ('sess_user2',2,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.12','Chrome/120.0')
ON CONFLICT DO NOTHING;
