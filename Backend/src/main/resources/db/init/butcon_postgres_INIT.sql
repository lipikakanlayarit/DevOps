-- =========================================================
--  butcon_postgres_INIT.sql  (FULL, idempotent)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================== USERS ===================
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

-- =================== ORGANIZERS ===================
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

-- =================== ADMIN_USERS ===================
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

-- =================== CATEGORIES ===================
CREATE TABLE IF NOT EXISTS categories (
                                          category_id SERIAL PRIMARY KEY,
                                          category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
    );

-- =================== EVENTS ===================
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
    status VARCHAR(50),
    cover_image BYTEA,
    cover_image_type VARCHAR(100),
    cover_updated_at TIMESTAMPTZ
    );

DO $$ BEGIN
BEGIN
EXECUTE 'ALTER TABLE events_nam ALTER COLUMN status SET DEFAULT ''PENDING''';
EXCEPTION WHEN others THEN NULL;
END;
END $$;

UPDATE events_nam SET status = 'PENDING' WHERE status IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='events_nam' AND constraint_name='events_status_check'
  ) THEN
ALTER TABLE events_nam
    ADD CONSTRAINT events_status_check
        CHECK (status IN ('PENDING','APPROVED','REJECTED','PUBLISHED'));
END IF;
END $$;

ALTER TABLE events_nam
    ADD COLUMN IF NOT EXISTS sales_start_datetime TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sales_end_datetime   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by INT REFERENCES admin_users(admin_id),
    ADD COLUMN IF NOT EXISTS cover_image_bytes INT
    GENERATED ALWAYS AS (octet_length(cover_image)) STORED,
    ADD COLUMN IF NOT EXISTS cover_image_sha1 TEXT
    GENERATED ALWAYS AS (
    CASE WHEN cover_image IS NULL THEN NULL
    ELSE encode(digest(cover_image, 'sha1'), 'hex')
    END
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_status ON events_nam(status);
CREATE INDEX IF NOT EXISTS idx_events_sales_window ON events_nam (sales_start_datetime, sales_end_datetime);

-- =================== TICKET TYPES ===================
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
    min_per_order INT,
    max_per_order INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

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

-- =================== RESERVED / PAYMENTS ===================
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

-- =================== SESSIONS ===================
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

-- =================== SEATING STRUCTURE ===================
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

-- ✅ MATCH Java Entity: seat_locks
CREATE TABLE IF NOT EXISTS seat_locks (
                                          lock_id    SERIAL PRIMARY KEY,
                                          seat_id    INT REFERENCES seats(seat_id) ON DELETE CASCADE,
    event_id   INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    user_id    INT REFERENCES users(user_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status     VARCHAR(20)   -- eg. LOCKED / RELEASED
    );

CREATE TABLE IF NOT EXISTS zone_ticket_types (
                                                 id SERIAL PRIMARY KEY,
                                                 zone_id INT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    ticket_type_id INT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
    );

-- =================== TRIGGERS ===================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname='tg_set_updated_at') THEN
    CREATE OR REPLACE FUNCTION tg_set_updated_at()
    RETURNS trigger AS $f$
BEGIN
      NEW.updated_at := NOW();
RETURN NEW;
END;
    $f$ LANGUAGE plpgsql;
END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_ticket_types_set_updated_at') THEN
CREATE TRIGGER trg_ticket_types_set_updated_at
    BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_seat_zones_set_updated_at') THEN
CREATE TRIGGER trg_seat_zones_set_updated_at
    BEFORE UPDATE ON seat_zones
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_seat_rows_set_updated_at') THEN
CREATE TRIGGER trg_seat_rows_set_updated_at
    BEFORE UPDATE ON seat_rows
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_seats_set_updated_at') THEN
CREATE TRIGGER trg_seats_set_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seat_zones_event_id ON seat_zones(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_rows_zone_id   ON seat_rows(zone_id);
CREATE INDEX IF NOT EXISTS idx_seats_row_id        ON seats(row_id);

-- =================== VIEWS (Landing) ===================
CREATE OR REPLACE VIEW public_events_on_sale AS
SELECT e.*
FROM events_nam e
WHERE UPPER(e.status) = 'APPROVED'
  AND (
    ( e.sales_start_datetime IS NOT NULL
        AND e.sales_end_datetime IS NOT NULL
        AND e.sales_start_datetime <= NOW()
        AND e.sales_end_datetime   >= NOW()
        )
        OR EXISTS (
        SELECT 1
        FROM ticket_types t
        WHERE t.event_id = e.event_id
          AND COALESCE(t.is_active, TRUE) = TRUE
          AND (t.sale_start_datetime IS NULL OR t.sale_start_datetime <= NOW())
          AND (t.sale_end_datetime   IS NULL OR t.sale_end_datetime   >= NOW())
          AND COALESCE(t.quantity_available, 0) > COALESCE(t.quantity_sold, 0)
    )
    );

GRANT SELECT ON public_events_on_sale TO PUBLIC;

CREATE OR REPLACE VIEW public_events_upcoming AS
WITH tt_min AS (
  SELECT event_id, MIN(sale_start_datetime) AS min_sale_start
  FROM ticket_types
  WHERE COALESCE(is_active, TRUE) = TRUE
  GROUP BY event_id
)
SELECT e.*
FROM events_nam e
         LEFT JOIN tt_min m ON m.event_id = e.event_id
WHERE UPPER(e.status) = 'APPROVED'
  AND (
    (e.sales_start_datetime IS NOT NULL AND e.sales_start_datetime > NOW())
        OR (e.sales_start_datetime IS NULL AND m.min_sale_start IS NOT NULL AND m.min_sale_start > NOW())
    )
ORDER BY COALESCE(e.sales_start_datetime, m.min_sale_start), e.event_id;

GRANT SELECT ON public_events_upcoming TO PUBLIC;

-- ✅ pretty view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema='public' AND table_name='events_nam_pretty'
  ) THEN
    EXECUTE 'DROP VIEW public.events_nam_pretty';
END IF;
END$$;

CREATE VIEW public.events_nam_pretty AS
SELECT
    event_id,
    organizer_id,
    event_name,
    description,
    category_id,
    start_datetime,
    end_datetime,
    sales_start_datetime,
    sales_end_datetime,
    venue_name,
    venue_address,
    max_capacity,
    status,
    cover_image_bytes,
    cover_image_type,
    cover_updated_at,
    cover_image_sha1
FROM events_nam;

GRANT SELECT ON public.events_nam_pretty TO PUBLIC;

-- =================== SEED DATA ===================
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles) VALUES
                                                                                                                     ('alice@example.com','alice123',   crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123','USER'),
                                                                                                                     ('admin@example.com','admin',      crypt('password123', gen_salt('bf', 10)),'Admin','User','0812345678','1234567890123','ADMIN'),
                                                                                                                     ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'Organizer','User','0822222222','1234567890124','ORGANIZER')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status) VALUES
                                                                                                                                                     ('org1@butcon.com','organizer',  crypt('password123', gen_salt('bf', 10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
                                                                                                                                                     ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf', 10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active) VALUES
    ('admin@butcon.com','admin', crypt('password123', gen_salt('bf', 10)), 'System','Admin','SUPERADMIN', TRUE)
    ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name, description) VALUES
                                                        ('Concert','Music concerts and live shows'),
                                                        ('Seminar','Business and academic seminars'),
                                                        ('Exhibition','Outdoor and cultural Exhibition')
    ON CONFLICT DO NOTHING;

-- =================== Seed events (PENDING) ===================
-- BUTCON Music Fest 2025 → Show: 20 Nov 2025 18:00–23:59 (+07)
INSERT INTO events_nam (organizer_id, event_name, description, category_id,
                        start_datetime, end_datetime, venue_name, venue_address,
                        max_capacity, status)
SELECT o.organizer_id, 'BUTCON Music Fest 2025','Annual outdoor music festival',1,
       TIMESTAMPTZ '2025-11-20 18:00:00+07', TIMESTAMPTZ '2025-11-20 23:59:59+07',
    'Central Park','Bangkok, Thailand',5000,'PENDING'
FROM organizers o WHERE o.email='org1@butcon.com'
    ON CONFLICT DO NOTHING;

-- Startup Seminar 2025 → Show: 20 Dec 2025 18:00–23:59 (+07)
INSERT INTO events_nam (organizer_id, event_name, description, category_id,
                        start_datetime, end_datetime, venue_name, venue_address,
                        max_capacity, status)
SELECT o.organizer_id, 'Startup Seminar 2025','Seminar for startups and investors',2,
       TIMESTAMPTZ '2025-12-20 18:00:00+07', TIMESTAMPTZ '2025-12-20 23:59:59+07',
    'Chiang Mai Conference Center','Chiang Mai, Thailand',300,'PENDING'
FROM organizers o WHERE o.email='org2@butcon.com'
    ON CONFLICT DO NOTHING;

-- =================== Base ticket types (Sale Opening Date = 22 Oct 2025, 12:00 +07) ===================
-- BUTCON Music Fest 2025 (ขายถึงเวลาเริ่มงาน 20 Nov 2025 18:00)
INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold,
                          sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order)
SELECT e.event_id, 'General Admission','Standard entry ticket',1500.00,3000,100,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07', TRUE, 1, 10
FROM events_nam e WHERE e.event_name='BUTCON Music Fest 2025'
    ON CONFLICT DO NOTHING;

INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold,
                          sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order)
SELECT e.event_id, 'VIP','VIP access with perks',5000.00,500,50,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07', TRUE, 1, 5
FROM events_nam e WHERE e.event_name='BUTCON Music Fest 2025'
    ON CONFLICT DO NOTHING;

-- Startup Seminar 2025 (ขายถึงเวลาเริ่มงาน 20 Dec 2025 18:00)
INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold,
                          sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order)
SELECT e.event_id, 'Seminar Pass','Full-day seminar pass',1000.00,200,20,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-12-20 18:00:00+07', TRUE, 1, 4
FROM events_nam e WHERE e.event_name='Startup Seminar 2025'
    ON CONFLICT DO NOTHING;

-- (ออปชัน) เซ็ต sales window ระดับ event ให้ตรงกับ requirement
UPDATE events_nam
SET sales_start_datetime = TIMESTAMPTZ '2025-10-22 12:00:00+07',
    sales_end_datetime   = CASE
      WHEN event_name='BUTCON Music Fest 2025'  THEN TIMESTAMPTZ '2025-11-20 18:00:00+07'
      WHEN event_name='Startup Seminar 2025'    THEN TIMESTAMPTZ '2025-12-20 18:00:00+07'
      ELSE sales_end_datetime
END
WHERE event_name IN ('BUTCON Music Fest 2025','Startup Seminar 2025');

-- =================== Approve known seeds & give sales window ===================
UPDATE events_nam
SET status = 'APPROVED',
    sales_start_datetime = COALESCE(sales_start_datetime, NOW() - INTERVAL '1 day'),
    sales_end_datetime   = COALESCE(sales_end_datetime,   NOW() + INTERVAL '30 days')
WHERE event_name IN ('BUTCON Music Fest 2025','Startup Seminar 2025')
  AND (status IS NULL OR UPPER(status)='PENDING');

-- Auto-approve & backfill the latest event of @organizer
DO $$ DECLARE v_ev BIGINT; BEGIN
SELECT e.event_id INTO v_ev
FROM events_nam e JOIN organizers o ON o.organizer_id=e.organizer_id
WHERE o.username='organizer'
ORDER BY e.event_id DESC LIMIT 1;

IF v_ev IS NOT NULL THEN
UPDATE events_nam
SET status='APPROVED',
    sales_start_datetime=COALESCE(sales_start_datetime, NOW()-INTERVAL '1 day'),
    sales_end_datetime  =COALESCE(sales_end_datetime,   NOW()+INTERVAL '30 days')
WHERE event_id=v_ev;

UPDATE ticket_types
SET is_active = COALESCE(is_active, TRUE),
    min_per_order = COALESCE(min_per_order, 1),
    max_per_order = COALESCE(max_per_order, 10),
    sale_start_datetime = COALESCE(sale_start_datetime, NOW()-INTERVAL '1 day'),
    sale_end_datetime   = COALESCE(sale_end_datetime,   NOW()+INTERVAL '30 day'),
    updated_at = NOW()
WHERE event_id=v_ev;
END IF;
END $$;

-- 🎫 Seat Map for BUTCON (single DO block — ไม่มี DO ซ้อน)
-- NOTE: ปรับ sale window ของบัตร: 22 Oct 2025 12:00 → 20 Nov 2025 18:00
DO $$
DECLARE
ev_id BIGINT;
  z_rec RECORD;
  r_label TEXT;
  i INT;
  c INT;
BEGIN
SELECT event_id INTO ev_id
FROM events_nam
WHERE event_name='BUTCON Music Fest 2025'
ORDER BY event_id DESC LIMIT 1;

IF ev_id IS NULL THEN
    RAISE NOTICE 'BUTCON Music Fest 2025 not found. Skip seat map.';
    RETURN;
END IF;

  -- clear previous
DELETE FROM zone_ticket_types WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seats       WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id));
DELETE FROM seat_rows   WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seat_zones  WHERE event_id=ev_id;
DELETE FROM ticket_types WHERE event_id=ev_id;

-- ticket types
INSERT INTO ticket_types (event_id,type_name,description,price,quantity_available,quantity_sold,
                          sale_start_datetime,sale_end_datetime,is_active,min_per_order,max_per_order,created_at,updated_at)
VALUES
    (ev_id,'VIP','Zone A premium front stage',2500,100,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,5,NOW(),NOW()),
    (ev_id,'REGULAR','Zone B standard seats',1500,200,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,5,NOW(),NOW()),
    (ev_id,'STANDING','Zone C standing area',800,500,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,10,NOW(),NOW());

-- zones
INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active, created_at, updated_at) VALUES
                                                                                                             (ev_id,'Zone A','VIP',1,TRUE,NOW(),NOW()),
                                                                                                             (ev_id,'Zone B','REGULAR',2,TRUE,NOW(),NOW()),
                                                                                                             (ev_id,'Zone C','STANDING',3,TRUE,NOW(),NOW());

-- map zone <-> ticket_type
INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
SELECT z.zone_id, t.ticket_type_id
FROM seat_zones z JOIN ticket_types t ON t.event_id=ev_id
WHERE z.event_id=ev_id AND (
    (z.description='VIP'      AND t.type_name='VIP')
        OR (z.description='REGULAR'  AND t.type_name='REGULAR')
        OR (z.description='STANDING' AND t.type_name='STANDING')
    );

-- rows A..E for VIP/REGULAR
FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id AND description IN ('VIP','REGULAR') ORDER BY sort_order
    LOOP
    FOR i IN 1..5 LOOP
      r_label := CHR(64 + i); -- A=65
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
VALUES (z_rec.zone_id, r_label, i, NOW(), NOW());
END LOOP;
END LOOP;

  -- seats 1..10 in each row (VIP/REGULAR)
FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id AND description IN ('VIP','REGULAR') ORDER BY sort_order
    LOOP
    FOR r_label IN SELECT row_label FROM seat_rows WHERE zone_id=z_rec.zone_id ORDER BY sort_order
    LOOP
      FOR c IN 1..10 LOOP
                   INSERT INTO seats (row_id, seat_number, seat_label, is_active, created_at, updated_at)
                   VALUES (
                           (SELECT row_id FROM seat_rows WHERE zone_id=z_rec.zone_id AND row_label=r_label LIMIT 1),
                           c, r_label || c, TRUE, NOW(), NOW()
                           );
END LOOP;
END LOOP;
END LOOP;
END
$$;

-- 🎓 Seat Map for Startup Seminar 2025
DO $$
DECLARE
ev_id BIGINT;
  z_rec RECORD;
  r_label TEXT;
  i INT;
  c INT;
BEGIN
SELECT event_id INTO ev_id
FROM events_nam
WHERE event_name='Startup Seminar 2025'
ORDER BY event_id DESC
    LIMIT 1;

IF ev_id IS NULL THEN
    RAISE NOTICE 'Startup Seminar 2025 not found. Skip seat map.';
    RETURN;
END IF;

  -- clear previous (เผื่อเคยมี)
DELETE FROM zone_ticket_types
WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id);
DELETE FROM seats
WHERE row_id IN (
    SELECT row_id FROM seat_rows
    WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id)
);
DELETE FROM seat_rows
WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id);
DELETE FROM seat_zones
WHERE event_id = ev_id;
DELETE FROM ticket_types
WHERE event_id = ev_id;

-- ticket types (Sale: 22 Oct 2025 12:00 → 20 Dec 2025 18:00)
INSERT INTO ticket_types (
    event_id, type_name, description, price, quantity_available, quantity_sold,
    sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order,
    created_at, updated_at
) VALUES
      (ev_id,'VIP','Front-row VIP seat',1500,50,0,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-12-20 18:00:00+07',
       TRUE, 1, 3, NOW(), NOW()),
      (ev_id,'STANDARD','Standard seat',800,150,0,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-12-20 18:00:00+07',
       TRUE, 1, 5, NOW(), NOW());

-- zones
INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active, created_at, updated_at)
VALUES
    (ev_id,'Zone A','VIP',1,TRUE,NOW(),NOW()),
    (ev_id,'Zone B','STANDARD',2,TRUE,NOW(),NOW());

-- zone <-> ticket
INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
SELECT z.zone_id, t.ticket_type_id
FROM seat_zones z
         JOIN ticket_types t ON t.event_id = z.event_id
WHERE z.event_id = ev_id
  AND (
    (z.description='VIP'      AND t.type_name='VIP')
        OR
    (z.description='STANDARD' AND t.type_name='STANDARD')
    );

-- rows A..C
FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id ORDER BY sort_order
    LOOP
    FOR i IN 1..3 LOOP
      r_label := CHR(64 + i); -- A,B,C
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
VALUES (z_rec.zone_id,r_label,i,NOW(),NOW());
END LOOP;
END LOOP;

  -- seats 1..10 per row
FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id ORDER BY sort_order
    LOOP
    FOR r_label IN SELECT row_label FROM seat_rows WHERE zone_id=z_rec.zone_id ORDER BY sort_order
    LOOP
      FOR c IN 1..10 LOOP
                   INSERT INTO seats (row_id, seat_number, seat_label, is_active, created_at, updated_at)
                   VALUES (
                           (SELECT row_id FROM seat_rows WHERE zone_id=z_rec.zone_id AND row_label=r_label LIMIT 1),
                           c, r_label || c, TRUE, NOW(), NOW()
                           );
END LOOP;
END LOOP;
END LOOP;
END
$$;

-- =================== END ===================
