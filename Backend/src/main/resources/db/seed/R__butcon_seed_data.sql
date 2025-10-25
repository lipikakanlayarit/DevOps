-- =========================================================
--  R__butcon_seed_data.sql
--  SEED ONLY (no CREATE/ALTER/INDEX/TRIGGER/VIEW here)
--  Idempotent via ON CONFLICT / guarded deletes by event name
-- =========================================================

-- ===== USERS / ORGANIZERS / ADMINS =====
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

-- ===== Seed events (PENDING -> APPROVED) =====
INSERT INTO events_nam (organizer_id, event_name, description, category_id,
                        start_datetime, end_datetime, venue_name, venue_address,
                        max_capacity, status)
SELECT o.organizer_id, 'BUTCON Music Fest 2025','Annual outdoor music festival',1,
       TIMESTAMPTZ '2025-11-20 18:00:00+07', TIMESTAMPTZ '2025-11-20 23:59:59+07',
    'Central Park','Bangkok, Thailand',5000,'PENDING'
FROM organizers o WHERE o.email='org1@butcon.com'
    ON CONFLICT DO NOTHING;

INSERT INTO events_nam (organizer_id, event_name, description, category_id,
                        start_datetime, end_datetime, venue_name, venue_address,
                        max_capacity, status)
SELECT o.organizer_id, 'Startup Seminar 2025','Seminar for startups and investors',2,
       TIMESTAMPTZ '2025-12-20 18:00:00+07', TIMESTAMPTZ '2025-12-20 23:59:59+07',
    'Chiang Mai Conference Center','Chiang Mai, Thailand',300,'PENDING'
FROM organizers o WHERE o.email='org2@butcon.com'
    ON CONFLICT DO NOTHING;

-- ===== Base ticket types (light defaults) =====
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

INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold,
                          sale_start_datetime, sale_end_datetime, is_active, min_per_order, max_per_order)
SELECT e.event_id, 'Seminar Pass','Full-day seminar pass',1000.00,200,20,
       TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-12-20 18:00:00+07', TRUE, 1, 4
FROM events_nam e WHERE e.event_name='Startup Seminar 2025'
    ON CONFLICT DO NOTHING;

-- Align sales window & approve
UPDATE events_nam
SET sales_start_datetime = TIMESTAMPTZ '2025-10-22 12:00:00+07',
    sales_end_datetime   = CASE
      WHEN event_name='BUTCON Music Fest 2025'  THEN TIMESTAMPTZ '2025-11-20 18:00:00+07'
      WHEN event_name='Startup Seminar 2025'    THEN TIMESTAMPTZ '2025-12-20 18:00:00+07'
      ELSE sales_end_datetime
END
WHERE event_name IN ('BUTCON Music Fest 2025','Startup Seminar 2025');

UPDATE events_nam
SET status = 'APPROVED',
    sales_start_datetime = COALESCE(sales_start_datetime, NOW() - INTERVAL '1 day'),
    sales_end_datetime   = COALESCE(sales_end_datetime,   NOW() + INTERVAL '30 days')
WHERE event_name IN ('BUTCON Music Fest 2025','Startup Seminar 2025')
  AND (status IS NULL OR UPPER(status)='PENDING');

-- Ensure most recent organizer's event is ACTIVE for demos
DO $$
DECLARE v_ev BIGINT;
BEGIN
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
    sale_end_datetime   = COALESCE(sale_end_datetime,   NOW()+INTERVAL '30 days'),
    updated_at = NOW()
WHERE event_id=v_ev;
END IF;
END $$;

-- ===== Seat Map for BUTCON (data only; guarded by event name) =====
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

DELETE FROM zone_ticket_types WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seats       WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id));
DELETE FROM seat_rows   WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seat_zones  WHERE event_id=ev_id;
DELETE FROM ticket_types WHERE event_id=ev_id;

INSERT INTO ticket_types (event_id,type_name,description,price,quantity_available,quantity_sold,
                          sale_start_datetime,sale_end_datetime,is_active,min_per_order,max_per_order,created_at,updated_at)
VALUES
    (ev_id,'VIP','Zone A premium front stage',2500,100,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,5,NOW(),NOW()),
    (ev_id,'REGULAR','Zone B standard seats',1500,200,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,5,NOW(),NOW()),
    (ev_id,'STANDING','Zone C standing area',800,500,0,
     TIMESTAMPTZ '2025-10-22 12:00:00+07', TIMESTAMPTZ '2025-11-20 18:00:00+07',TRUE,1,10,NOW(),NOW());

INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active, created_at, updated_at) VALUES
                                                                                                             (ev_id,'Zone A','VIP',1,TRUE,NOW(),NOW()),
                                                                                                             (ev_id,'Zone B','REGULAR',2,TRUE,NOW(),NOW()),
                                                                                                             (ev_id,'Zone C','STANDING',3,TRUE,NOW(),NOW());

INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
SELECT z.zone_id, t.ticket_type_id
FROM seat_zones z JOIN ticket_types t ON t.event_id=ev_id
WHERE z.event_id=ev_id AND (
    (z.description='VIP'      AND t.type_name='VIP')
        OR (z.description='REGULAR'  AND t.type_name='REGULAR')
        OR (z.description='STANDING' AND t.type_name='STANDING')
    );

FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id AND description IN ('VIP','REGULAR') ORDER BY sort_order
    LOOP
    FOR i IN 1..5 LOOP
      r_label := CHR(64 + i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
VALUES (z_rec.zone_id, r_label, i, NOW(), NOW());
END LOOP;
END LOOP;

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

-- ===== Seat Map for Startup Seminar 2025 =====
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
ORDER BY event_id DESC LIMIT 1;

IF ev_id IS NULL THEN
    RAISE NOTICE 'Startup Seminar 2025 not found. Skip seat map.';
    RETURN;
END IF;

DELETE FROM zone_ticket_types WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id);
DELETE FROM seats           WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id));
DELETE FROM seat_rows       WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id = ev_id);
DELETE FROM seat_zones      WHERE event_id = ev_id;
DELETE FROM ticket_types    WHERE event_id = ev_id;

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

INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active, created_at, updated_at)
VALUES
    (ev_id,'Zone A','VIP',1,TRUE,NOW(),NOW()),
    (ev_id,'Zone B','STANDARD',2,TRUE,NOW(),NOW());

INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
SELECT z.zone_id, t.ticket_type_id
FROM seat_zones z JOIN ticket_types t ON t.event_id = z.event_id
WHERE z.event_id = ev_id
  AND (
    (z.description='VIP'      AND t.type_name='VIP')
        OR (z.description='STANDARD' AND t.type_name='STANDARD')
    );

FOR z_rec IN SELECT * FROM seat_zones WHERE event_id=ev_id ORDER BY sort_order LOOP
    FOR i IN 1..3 LOOP
      r_label := CHR(64 + i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
VALUES (z_rec.zone_id,r_label,i,NOW(),NOW());
END LOOP;
END LOOP;

FOR z_rec IN SELECT * FROM seat_zones WHERE event_id=ev_id ORDER BY sort_order LOOP
    FOR r_label IN SELECT row_label FROM seat_rows WHERE zone_id=z_rec.zone_id ORDER BY sort_order LOOP
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
