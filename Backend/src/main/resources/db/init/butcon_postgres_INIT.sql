-- =========================
-- BASE SCHEMA + SEED (CLEAN)
-- =========================

-- 1) EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) TABLES (CORE)
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
  venue_address TEXT,
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

-- ช่วยให้ seed ซ้ำได้โดยไม่ชนกัน
CREATE UNIQUE INDEX IF NOT EXISTS ux_reserved_confirmation_code ON reserved(confirmation_code);

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

-- 3) TABLES (SEATING MODEL ให้ตรงกับที่ backend ใช้)
CREATE TABLE IF NOT EXISTS seat_zones (
  zone_id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
  zone_name VARCHAR(255),
  description VARCHAR(255),
  sort_order INT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seat_rows (
  row_id SERIAL PRIMARY KEY,
  zone_id INT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  row_label VARCHAR(255),
  sort_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS seats (
  seat_id SERIAL PRIMARY KEY,
  row_id INT REFERENCES seat_rows(row_id) ON DELETE CASCADE,
  seat_label VARCHAR(255),
  seat_number INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reserved_seats (
  reserved_id INT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
  seat_id INT REFERENCES seats(seat_id) ON DELETE CASCADE,
  PRIMARY KEY (reserved_id, seat_id)
);

-- zone กับ ticket type (ถ้าต้อง map ราคาตามโซนให้เปิดใช้)
CREATE TABLE IF NOT EXISTS zone_ticket_types (
  zone_id INT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
  ticket_type_id INT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
  PRIMARY KEY (zone_id, ticket_type_id)
);

-- 4) SEED DATA
-- USERS
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles) VALUES
  ('alice@example.com','alice123', crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123','USER'),
  ('admin@example.com','admin',    crypt('password123', gen_salt('bf', 10)),'admin','user','0812345678','1234567890123','ADMIN'),
  ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'organizer','user','0812345678','1234567890123','ORGANIZER'),
  ('bob@example.com','bob456',     crypt('password123', gen_salt('bf', 10)),'Bob','Tan','0823456789','9876543210123','USER')
ON CONFLICT (email) DO NOTHING;

-- ORGANIZERS
INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status) VALUES
  ('org1@butcon.com','organizer',  crypt('password123', gen_salt('bf', 10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
  ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf', 10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
ON CONFLICT (email) DO NOTHING;

-- ADMIN
INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active) VALUES
  ('admin@butcon.com','admin', crypt('password123', gen_salt('bf', 10)), 'System','Admin','SUPERADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;

-- CATEGORIES
INSERT INTO categories (category_name, description) VALUES
  ('Concert','Music concerts and live shows'),
  ('Seminar','Business and academic seminars'),
  ('Festival','Outdoor and cultural festivals')
ON CONFLICT DO NOTHING;

-- EVENTS (10 งาน)
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

-- TICKET TYPES
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

-- 5) SEATING SEED (ตัวอย่างให้ event 1 และ 2 มีผังที่นั่งจริง)
-- Zones
INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active) VALUES
  (1,'Zone A','Front seats',1,TRUE),
  (1,'Zone B','Middle seats',2,TRUE),
  (2,'Pit','Front standing/seats',1,TRUE)
ON CONFLICT DO NOTHING;

-- Rows (A,B สำหรับ event 1; P สำหรับ event 2)
INSERT INTO seat_rows (zone_id, row_label, sort_order) VALUES
  ((SELECT zone_id FROM seat_zones WHERE event_id=1 AND zone_name='Zone A'),'A',1),
  ((SELECT zone_id FROM seat_zones WHERE event_id=1 AND zone_name='Zone A'),'B',2),
  ((SELECT zone_id FROM seat_zones WHERE event_id=1 AND zone_name='Zone B'),'A',1),
  ((SELECT zone_id FROM seat_zones WHERE event_id=2 AND zone_name='Pit'),'P',1)
ON CONFLICT DO NOTHING;

-- Seats 1..10 ต่อแถว (เล็ก ๆ พอทดสอบ)
DO $$
DECLARE
  r RECORD;
  i INT;
BEGIN
  -- event 1 zone A rows A,B
  FOR r IN
    SELECT row_id, row_label FROM seat_rows sr
    JOIN seat_zones sz ON sz.zone_id = sr.zone_id
    WHERE sz.event_id = 1 AND sz.zone_name IN ('Zone A','Zone B')
  LOOP
    FOR i IN 1..10 LOOP
      INSERT INTO seats (row_id, seat_label, seat_number, is_active)
      VALUES (r.row_id, r.row_label || '-' || i::text, i, TRUE)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- event 2 Pit row P
  FOR r IN
    SELECT sr.row_id, sr.row_label FROM seat_rows sr
    JOIN seat_zones sz ON sz.zone_id = sr.zone_id
    WHERE sz.event_id = 2 AND sr.row_label='P'
  LOOP
    FOR i IN 1..10 LOOP
      INSERT INTO seats (row_id, seat_label, seat_number, is_active)
      VALUES (r.row_id, r.row_label || '-' || i::text, i, TRUE)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END$$;

-- 6) RESERVED (ทำยอดและรหัสอ้างอิงให้ไม่ซ้ำ)
INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes) VALUES
  (1,1,1,2,3000.00,'PAID','CONF001ABC','Early bird'),        -- alice, event 1 GA 2 ใบ
  (2,1,2,1,5000.00,'PENDING','CONF002DEF','Need invoice'),   -- admin, event 1 VIP 1 ใบ
  (3,2,3,3,5400.00,'PAID','CONF003GHI','Front row seats'),   -- organizer user, event 2 Standing 3 ใบ
  (2,3,4,2,2400.00,'PAID','CONF004JKL','Jazz night'),
  (4,4,5,1,2500.00,'PAID','CONF005MNO','Rockwave fan'),
  (1,5,6,1,1000.00,'PAID','CONF006PQR','Business trip'),
  (2,6,7,1,1200.00,'PAID','CONF007STU','VIP seat'),
  (3,8,8,4,3200.00,'PAID','CONF008VWX','Festival crew'),
  (1,9,9,2,1000.00,'PAID','CONF009YZA','Food fest lovers'),
  (2,10,10,5,4500.00,'PENDING','CONF010BCD','Group booking')
ON CONFLICT ON CONSTRAINT ux_reserved_confirmation_code DO NOTHING;

-- 7) ผูกที่นั่งกับใบจอง (ให้หน้าโปรไฟล์นับ “หลายใบ” + โชว์รายละเอียดที่นั่ง)
-- reserved_id 1: event 1, เอาที่นั่ง A-1, A-2
INSERT INTO reserved_seats (reserved_id, seat_id)
SELECT r.reserved_id, s.seat_id
FROM reserved r
JOIN events_nam e ON e.event_id = r.event_id
JOIN seat_zones sz ON sz.event_id = e.event_id AND sz.zone_name='Zone A'
JOIN seat_rows  sr ON sr.zone_id = sz.zone_id AND sr.row_label='A'
JOIN seats      s  ON s.row_id  = sr.row_id AND s.seat_number IN (1,2)
WHERE r.confirmation_code='CONF001ABC'
ON CONFLICT DO NOTHING;

-- reserved_id 3: event 2, เอาที่นั่ง P-1, P-2, P-3
INSERT INTO reserved_seats (reserved_id, seat_id)
SELECT r.reserved_id, s.seat_id
FROM reserved r
JOIN seat_zones sz ON sz.event_id = r.event_id AND sz.zone_name='Pit'
JOIN seat_rows  sr ON sr.zone_id = sz.zone_id AND sr.row_label='P'
JOIN seats      s  ON s.row_id  = sr.row_id AND s.seat_number IN (1,2,3)
WHERE r.confirmation_code='CONF003GHI'
ON CONFLICT DO NOTHING;

-- 8) PAYMENTS
INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response) VALUES
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF001ABC'),3000.00,'Credit Card','TXN001','SUCCESS','Approved by gateway'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF002DEF'),5000.00,'Bank Transfer','TXN002','PENDING',NULL),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF003GHI'),5400.00,'Credit Card','TXN003','SUCCESS','Processed'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF004JKL'),2400.00,'E-Wallet','TXN004','SUCCESS','Wallet OK'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF005MNO'),2500.00,'Bank Transfer','TXN005','SUCCESS','Cleared'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF006PQR'),1000.00,'E-Wallet','TXN006','SUCCESS','Confirmed'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF007STU'),1200.00,'Credit Card','TXN007','SUCCESS','Approved'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF008VWX'),3200.00,'Credit Card','TXN008','SUCCESS','Approved'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF009YZA'),1000.00,'E-Wallet','TXN009','SUCCESS','Paid'),
  ((SELECT reserved_id FROM reserved WHERE confirmation_code='CONF010BCD'),4500.00,'Bank Transfer','TXN010','PENDING',NULL)
ON CONFLICT DO NOTHING;

-- 9) SESSIONS (ไม่ซ้ำ)
INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES ('sess_org1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.10','Mozilla/5.0')
ON CONFLICT DO NOTHING;

INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
  ('sess_user1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.11','Mozilla/5.0'),
  ('sess_user2',2,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.12','Chrome/120.0')
ON CONFLICT DO NOTHING;
