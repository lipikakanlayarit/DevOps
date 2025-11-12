-- =========================================================
--  R__butcon_seed_data.sql
--  SEED ONLY (no CREATE/ALTER/INDEX/TRIGGER/VIEW here)
--  Idempotent via ON CONFLICT / guarded deletes by event name
-- =========================================================

/* =========================
   USERS / ORGANIZERS / ADMINS
   ========================= */
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles)
VALUES
    ('alice@example.com','alice123',   crypt('password123', gen_salt('bf',10)),'Alice','Wong','0812345678','1234567890123','USER'),
    ('admin@example.com','admin',      crypt('password123', gen_salt('bf',10)),'Admin','User','0812345678','1234567890123','ADMIN'),
    ('organizer@example.com','organizer', crypt('password123', gen_salt('bf',10)),'Organizer','User','0822222222','1234567890124','ORGANIZER')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status)
VALUES
    ('org1@butcon.com','organizer',  crypt('password123', gen_salt('bf',10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
    ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf',10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
    ON CONFLICT (email) DO NOTHING;

INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active)
VALUES ('admin@butcon.com','admin', crypt('password123', gen_salt('bf',10)), 'System','Admin','SUPERADMIN', TRUE)
    ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name, description) VALUES
                                                        ('Concert','Music concerts and live shows'),
                                                        ('Seminar','Business and academic seminars'),
                                                        ('Exhibition','Outdoor and cultural Exhibition')
    ON CONFLICT DO NOTHING;

/* =========================
   EVENTS
   ========================= */
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

/* =========================
   STATUS + SALES WINDOW
   ========================= */
UPDATE events_nam
SET status='APPROVED',
    sales_start_datetime = COALESCE(sales_start_datetime, NOW()-INTERVAL '1 day'),
    sales_end_datetime   = COALESCE(sales_end_datetime,   NOW()+INTERVAL '30 days')
WHERE event_name IN ('BUTCON Music Fest 2025','Startup Seminar 2025');

/* =========================
   SEAT MAP: BUTCON
   ========================= */
DO $$
DECLARE
ev_id  BIGINT;
  z_rec  RECORD;
  r_label TEXT;
  i INT; c INT;
BEGIN
SELECT event_id INTO ev_id
FROM events_nam WHERE event_name='BUTCON Music Fest 2025'
ORDER BY event_id DESC LIMIT 1;
IF ev_id IS NULL THEN RETURN; END IF;

DELETE FROM zone_ticket_types WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seats            WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id));
DELETE FROM seat_rows        WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seat_zones       WHERE event_id=ev_id;
DELETE FROM ticket_types     WHERE event_id=ev_id;

INSERT INTO ticket_types (event_id,type_name,description,price,quantity_available,quantity_sold,
                          sale_start_datetime,sale_end_datetime,is_active,min_per_order,max_per_order,created_at,updated_at)
VALUES
    (ev_id,'VIP','Zone A premium front stage',2500,50,0, NOW()-INTERVAL '1 day', NOW()+INTERVAL '20 day', TRUE,1,5,NOW(),NOW()),
    (ev_id,'REGULAR','Zone B standard seats',1500,50,0, NOW()-INTERVAL '1 day', NOW()+INTERVAL '20 day', TRUE,1,5,NOW(),NOW()),
    (ev_id,'STANDING','Zone C standing area',800,0,0, NOW()-INTERVAL '1 day', NOW()+INTERVAL '20 day', TRUE,1,10,NOW(),NOW());

INSERT INTO seat_zones (event_id,zone_name,description,sort_order,is_active,created_at,updated_at) VALUES
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

-- Zone A (VIP): 5 rows x 10 cols
FOR i IN 1..5 LOOP
      r_label := CHR(64+i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
SELECT zone_id, r_label, i-1, NOW(), NOW()
FROM seat_zones WHERE event_id=ev_id AND description='VIP';
END LOOP;

-- Zone B (REGULAR): 5 rows x 10 cols
FOR i IN 1..5 LOOP
      r_label := CHR(64+i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
SELECT zone_id, r_label, i-1, NOW(), NOW()
FROM seat_zones WHERE event_id=ev_id AND description='REGULAR';
END LOOP;

-- สร้างที่นั่งสำหรับ Zone A และ Zone B (แต่ละแถว 10 ที่นั่ง)
FOR z_rec IN
SELECT * FROM seat_zones WHERE event_id=ev_id AND description IN ('VIP','REGULAR') ORDER BY sort_order
    LOOP
    FOR r_label IN SELECT row_label FROM seat_rows WHERE zone_id=z_rec.zone_id ORDER BY sort_order LOOP
      FOR c IN 1..10 LOOP
                   INSERT INTO seats (row_id, seat_number, seat_label, is_active, created_at, updated_at)
                   VALUES (
                           (SELECT row_id FROM seat_rows WHERE zone_id=z_rec.zone_id AND row_label=r_label LIMIT 1),
                           c, r_label||c, TRUE, NOW(), NOW()
                           );
END LOOP;
END LOOP;
END LOOP;

-- Zone C (STANDING) ไม่มีที่นั่ง (quantity_available = 0 แล้ว)
END $$;

/* =========================
   SEAT MAP: STARTUP SEMINAR
   ========================= */
DO $$
DECLARE
ev_id  BIGINT;
  z_rec  RECORD;
  r_label TEXT;
  i INT; c INT;
BEGIN
SELECT event_id INTO ev_id
FROM events_nam WHERE event_name='Startup Seminar 2025'
ORDER BY event_id DESC LIMIT 1;
IF ev_id IS NULL THEN RETURN; END IF;

DELETE FROM zone_ticket_types WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seats            WHERE row_id IN (SELECT row_id FROM seat_rows WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id));
DELETE FROM seat_rows        WHERE zone_id IN (SELECT zone_id FROM seat_zones WHERE event_id=ev_id);
DELETE FROM seat_zones       WHERE event_id=ev_id;
DELETE FROM ticket_types     WHERE event_id=ev_id;

INSERT INTO ticket_types (event_id,type_name,description,price,quantity_available,quantity_sold,
                          sale_start_datetime,sale_end_datetime,is_active,min_per_order,max_per_order,created_at,updated_at)
VALUES
    (ev_id,'VIP','Front-row VIP seat',1500,30,0, NOW()-INTERVAL '1 day', NOW()+INTERVAL '30 day', TRUE,1,3,NOW(),NOW()),
    (ev_id,'STANDARD','Standard seat',800,30,0, NOW()-INTERVAL '1 day', NOW()+INTERVAL '30 day', TRUE,1,5,NOW(),NOW());

INSERT INTO seat_zones (event_id,zone_name,description,sort_order,is_active,created_at,updated_at)
VALUES
    (ev_id,'Zone A','VIP',1,TRUE,NOW(),NOW()),
    (ev_id,'Zone B','STANDARD',2,TRUE,NOW(),NOW());

INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
SELECT z.zone_id, t.ticket_type_id
FROM seat_zones z JOIN ticket_types t ON t.event_id=z.event_id
WHERE z.event_id=ev_id AND (
    (z.description='VIP'      AND t.type_name='VIP')
        OR (z.description='STANDARD' AND t.type_name='STANDARD')
    );

-- Zone A (VIP): 3 rows x 10 cols
FOR i IN 1..3 LOOP
      r_label := CHR(64+i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
SELECT zone_id, r_label, i-1, NOW(), NOW()
FROM seat_zones WHERE event_id=ev_id AND description='VIP';
END LOOP;

-- Zone B (STANDARD): 3 rows x 10 cols
FOR i IN 1..3 LOOP
      r_label := CHR(64+i);
INSERT INTO seat_rows (zone_id,row_label,sort_order,created_at,updated_at)
SELECT zone_id, r_label, i-1, NOW(), NOW()
FROM seat_zones WHERE event_id=ev_id AND description='STANDARD';
END LOOP;

-- สร้างที่นั่งสำหรับทั้ง 2 zones (แต่ละแถว 10 ที่นั่ง)
FOR z_rec IN SELECT * FROM seat_zones WHERE event_id=ev_id ORDER BY sort_order LOOP
    FOR r_label IN SELECT row_label FROM seat_rows WHERE zone_id=z_rec.zone_id ORDER BY sort_order LOOP
      FOR c IN 1..10 LOOP
                   INSERT INTO seats (row_id, seat_number, seat_label, is_active, created_at, updated_at)
                   VALUES (
                                                                                                      (SELECT row_id FROM seat_rows WHERE zone_id=z_rec.zone_id AND row_label=r_label LIMIT 1),
                                                                                                      c, r_label||c, TRUE, NOW(), NOW()
                                                                                                      );
END LOOP;
END LOOP;
END LOOP;
END $$;

/* =========================
   DEMO PURCHASES (ปรับให้ตรงภาพ)
   BUTCON: A2, A3 (VIP Zone) → 2 ที่นั่ง PAID
   SEMINAR: A1 (VIP Zone) → 1 ที่นั่ง PAID
   ========================= */
DO $$
DECLARE
v_user_id        BIGINT;
  v_ev_butcon      BIGINT;
  v_ev_seminar     BIGINT;
  v_tt_vip_butcon  BIGINT;
  v_tt_vip_seminar BIGINT;
  v_price_butcon   NUMERIC;
  v_price_seminar  NUMERIC;
  v_res1           BIGINT;
  v_res2           BIGINT;
  v_seat_a2        BIGINT;
  v_seat_a3        BIGINT;
  v_seat_sem_a1    BIGINT;
BEGIN
SELECT user_id INTO v_user_id FROM users WHERE email='alice@example.com' LIMIT 1;
IF v_user_id IS NULL THEN
    RAISE NOTICE 'skip demo purchases: user not found';
    RETURN;
END IF;

SELECT event_id INTO v_ev_butcon  FROM events_nam WHERE event_name='BUTCON Music Fest 2025'  ORDER BY event_id DESC LIMIT 1;
SELECT event_id INTO v_ev_seminar FROM events_nam WHERE event_name='Startup Seminar 2025' ORDER BY event_id DESC LIMIT 1;
IF v_ev_butcon IS NULL OR v_ev_seminar IS NULL THEN
    RAISE NOTICE 'skip demo purchases: events missing';
    RETURN;
END IF;

SELECT ticket_type_id, price INTO v_tt_vip_butcon,  v_price_butcon
FROM ticket_types WHERE event_id=v_ev_butcon  AND UPPER(type_name)='VIP' LIMIT 1;

SELECT ticket_type_id, price INTO v_tt_vip_seminar, v_price_seminar
FROM ticket_types WHERE event_id=v_ev_seminar AND UPPER(type_name)='VIP' LIMIT 1;

IF v_tt_vip_butcon IS NULL OR v_tt_vip_seminar IS NULL THEN
    RAISE NOTICE 'skip demo purchases: VIP ticket types missing';
    RETURN;
END IF;

  -- หาที่นั่ง BUTCON: Zone A, Row A, Seat 2 และ 3
SELECT s.seat_id INTO v_seat_a2
FROM seats s
         JOIN seat_rows sr ON sr.row_id = s.row_id
         JOIN seat_zones z ON z.zone_id = sr.zone_id
WHERE z.event_id = v_ev_butcon
  AND z.description = 'VIP'
  AND sr.row_label = 'A'
  AND s.seat_number = 2
    LIMIT 1;

SELECT s.seat_id INTO v_seat_a3
FROM seats s
         JOIN seat_rows sr ON sr.row_id = s.row_id
         JOIN seat_zones z ON z.zone_id = sr.zone_id
WHERE z.event_id = v_ev_butcon
  AND z.description = 'VIP'
  AND sr.row_label = 'A'
  AND s.seat_number = 3
    LIMIT 1;

-- หาที่นั่ง SEMINAR: Zone A, Row A, Seat 1
SELECT s.seat_id INTO v_seat_sem_a1
FROM seats s
         JOIN seat_rows sr ON sr.row_id = s.row_id
         JOIN seat_zones z ON z.zone_id = sr.zone_id
WHERE z.event_id = v_ev_seminar
  AND z.description = 'VIP'
  AND sr.row_label = 'A'
  AND s.seat_number = 1
    LIMIT 1;

-- ลบข้อมูลเก่า (idempotent)
DELETE FROM reserved_seats WHERE reserved_id IN (
    SELECT reserved_id FROM reserved WHERE confirmation_code IN ('RSV-2025-0001','RSV-2025-0002')
);
DELETE FROM reserved WHERE confirmation_code IN ('RSV-2025-0001','RSV-2025-0002');

-- Reservation #1: BUTCON Music Fest (2 seats: A2, A3)
INSERT INTO reserved (
    user_id, event_id, ticket_type_id, quantity, total_amount,
    payment_status, confirmation_code, registration_datetime, payment_method
)
VALUES (
           v_user_id, v_ev_butcon, v_tt_vip_butcon, 2, v_price_butcon * 2,
           'PAID', 'RSV-2025-0001', NOW() - INTERVAL '2 days', 'Bank Transfer'
       )
    RETURNING reserved_id INTO v_res1;

IF v_res1 IS NOT NULL AND v_seat_a2 IS NOT NULL THEN
INSERT INTO reserved_seats (reserved_id, seat_id) VALUES (v_res1, v_seat_a2);
END IF;
  IF v_res1 IS NOT NULL AND v_seat_a3 IS NOT NULL THEN
INSERT INTO reserved_seats (reserved_id, seat_id) VALUES (v_res1, v_seat_a3);
END IF;

  -- Reservation #2: Startup Seminar (1 seat: A1)
INSERT INTO reserved (
    user_id, event_id, ticket_type_id, quantity, total_amount,
    payment_status, confirmation_code, registration_datetime, payment_method
)
VALUES (
           v_user_id, v_ev_seminar, v_tt_vip_seminar, 1, v_price_seminar,
           'PAID', 'RSV-2025-0002', NOW() - INTERVAL '1 days', 'Credit Card'
       )
    RETURNING reserved_id INTO v_res2;

IF v_res2 IS NOT NULL AND v_seat_sem_a1 IS NOT NULL THEN
INSERT INTO reserved_seats (reserved_id, seat_id) VALUES (v_res2, v_seat_sem_a1);
END IF;

  RAISE NOTICE 'seed purchases: done';
END
$$;
-- =================== END ===================