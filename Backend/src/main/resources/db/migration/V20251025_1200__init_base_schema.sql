-- =========================================================
--  V20251025_1200__init_base_schema.sql
--  INITIAL SCHEMA (no seed)
--  + Compatibility layer for seed: reservations / reservation_tickets
--  + Fix: INSTEAD OF TRIGGER with robust ticket_type_id resolution
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================== USERS ===================
CREATE TABLE IF NOT EXISTS users (
                                     user_id BIGSERIAL PRIMARY KEY,
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
                                          organizer_id BIGSERIAL PRIMARY KEY,
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
                                           admin_id BIGSERIAL PRIMARY KEY,
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
                                          category_id BIGSERIAL PRIMARY KEY,
                                          category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
    );

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE categories SET is_active = TRUE WHERE is_active IS NULL;

-- =================== EVENTS ===================
CREATE TABLE IF NOT EXISTS events_nam (
                                          event_id BIGSERIAL PRIMARY KEY,
                                          organizer_id BIGINT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
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

DO $$
BEGIN
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN event_id TYPE BIGINT';     EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN organizer_id TYPE BIGINT'; EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN category_id TYPE BIGINT';  EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN cover_image TYPE BYTEA';   EXCEPTION WHEN others THEN NULL; END;
END$$;

DO $$
BEGIN
BEGIN
EXECUTE 'ALTER TABLE events_nam ALTER COLUMN status SET DEFAULT ''PENDING''';
EXCEPTION WHEN others THEN NULL; END;
END $$;

UPDATE events_nam SET status = 'PENDING' WHERE status IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'events_status_check'
          AND conrelid = 'events_nam'::regclass
    ) THEN
ALTER TABLE events_nam DROP CONSTRAINT events_status_check;
END IF;
END $$;

ALTER TABLE events_nam
    ADD COLUMN IF NOT EXISTS sales_start_datetime TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sales_end_datetime   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES admin_users(admin_id),
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
                                            ticket_type_id BIGSERIAL PRIMARY KEY,
                                            event_id BIGINT REFERENCES events_nam(event_id) ON DELETE CASCADE,
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'ticket_types'::regclass AND attname='created_at' AND NOT attisdropped
    ) THEN EXECUTE 'ALTER TABLE ticket_types ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'ticket_types'::regclass AND attname='updated_at' AND NOT attisdropped
    ) THEN EXECUTE 'ALTER TABLE ticket_types ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'ticket_types'::regclass AND attname='min_per_order' AND NOT attisdropped
    ) THEN EXECUTE 'ALTER TABLE ticket_types ADD COLUMN min_per_order INT'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'ticket_types'::regclass AND attname='max_per_order' AND NOT attisdropped
    ) THEN EXECUTE 'ALTER TABLE ticket_types ADD COLUMN max_per_order INT'; END IF;
END
$$;

UPDATE ticket_types
SET created_at    = COALESCE(created_at, NOW()),
    updated_at    = COALESCE(updated_at, NOW()),
    min_per_order = COALESCE(min_per_order, 1),
    max_per_order = COALESCE(max_per_order, 1);

-- =================== RESERVED / PAYMENTS (core tables) ===================
CREATE TABLE IF NOT EXISTS reserved (
                                        reserved_id BIGSERIAL PRIMARY KEY,
                                        user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    ticket_type_id BIGINT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity INT,
    total_amount NUMERIC(10,2),
    payment_status VARCHAR(50),
    confirmation_code VARCHAR(100),
    notes TEXT
    );

ALTER TABLE reserved
    ADD COLUMN IF NOT EXISTS registration_datetime TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_datetime      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_method        VARCHAR(50);

CREATE TABLE IF NOT EXISTS payments (
                                        payment_id BIGSERIAL PRIMARY KEY,
                                        reserved_id BIGINT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    amount NUMERIC(10,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_status VARCHAR(255),
    gateway_response TEXT
    );

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_datetime TIMESTAMPTZ;

DO $$
BEGIN
BEGIN EXECUTE 'ALTER TABLE payments ALTER COLUMN reserved_id   TYPE BIGINT';        EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE payments ALTER COLUMN transaction_id TYPE VARCHAR(255)'; EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE payments ALTER COLUMN payment_status TYPE VARCHAR(255)'; EXCEPTION WHEN others THEN NULL; END;
END$$;

-- =================== SESSIONS ===================
CREATE TABLE IF NOT EXISTS organizer_sessions (
                                                  session_id VARCHAR(100) PRIMARY KEY,
    organizer_id BIGINT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

CREATE TABLE IF NOT EXISTS user_sessions (
                                             session_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

-- =================== SEATING STRUCTURE ===================
CREATE TABLE IF NOT EXISTS seat_zones (
                                          zone_id BIGSERIAL PRIMARY KEY,
                                          event_id BIGINT REFERENCES events_nam(event_id) ON DELETE CASCADE,
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
                                         row_id BIGSERIAL PRIMARY KEY,
                                         zone_id BIGINT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    row_label VARCHAR(10),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS seats (
                                     seat_id BIGSERIAL PRIMARY KEY,
                                     row_id BIGINT REFERENCES seat_rows(row_id) ON DELETE CASCADE,
    seat_number INT,
    seat_label VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS reserved_seats (
                                              reserved_seat_id BIGSERIAL PRIMARY KEY,
                                              reserved_id BIGINT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    seat_id BIGINT REFERENCES seats(seat_id) ON DELETE CASCADE
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='ux_reserved_seats_reserved_seat'
    ) THEN
CREATE UNIQUE INDEX ux_reserved_seats_reserved_seat
    ON reserved_seats (reserved_id, seat_id);
END IF;
END $$;

CREATE TABLE IF NOT EXISTS seat_locks (
                                          lock_id    BIGSERIAL PRIMARY KEY,
                                          seat_id    BIGINT REFERENCES seats(seat_id) ON DELETE CASCADE,
    event_id   BIGINT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    user_id    BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    locked_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status     VARCHAR(20) DEFAULT 'LOCKED'
    );

-- ⭐ เพิ่ม unique constraint กันล็อกซ้ำ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='ux_seat_locks_seat'
    ) THEN
CREATE UNIQUE INDEX ux_seat_locks_seat ON seat_locks (seat_id);
END IF;
END $$;

CREATE TABLE IF NOT EXISTS zone_ticket_types (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 zone_id BIGINT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    ticket_type_id BIGINT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
    );

-- ⭐ เพิ่ม unique constraint กัน duplicate mapping
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='ux_zone_ticket_types'
    ) THEN
CREATE UNIQUE INDEX ux_zone_ticket_types ON zone_ticket_types (zone_id, ticket_type_id);
END IF;
END $$;

-- =================== TRIGGERS (updated_at) ===================
DO $$
BEGIN
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

DO $$
BEGIN
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

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_categories_set_updated_at') THEN
CREATE TRIGGER trg_categories_set_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seat_zones_event_id ON seat_zones(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_rows_zone_id   ON seat_rows(zone_id);
CREATE INDEX IF NOT EXISTS idx_seats_row_id        ON seats(row_id);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expires  ON seat_locks(expires_at) WHERE status = 'LOCKED';

-- =================== VIEWS (public) ===================
CREATE OR REPLACE VIEW public_events_on_sale AS
SELECT e.*
FROM events_nam e
WHERE UPPER(e.status) = 'APPROVED'
  AND (
    (
        e.sales_start_datetime IS NOT NULL
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

CREATE OR REPLACE VIEW public.events_nam_pretty AS
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

-- =================== COMPAT LAYER for seed ===================
-- reservations (VIEW) <-> reserved (TABLE)
CREATE OR REPLACE VIEW reservations AS
SELECT
    r.reserved_id           AS reservation_id,
    r.user_id,
    r.event_id,
    r.ticket_type_id,
    r.quantity,
    r.total_amount,
    r.payment_status        AS status,
    r.confirmation_code     AS reserve_code,
    r.registration_datetime AS created_at,
    r.payment_method
FROM reserved r;

-- passthrough insert into base table
CREATE OR REPLACE RULE reservations_ins AS
    ON INSERT TO reservations DO INSTEAD
INSERT INTO reserved (
    user_id,
    event_id,
    ticket_type_id,
    quantity,
    total_amount,
    payment_status,
    confirmation_code,
    registration_datetime,
    payment_method
)
VALUES (
           NEW.user_id,
           NEW.event_id,
           NEW.ticket_type_id,
           COALESCE(NEW.quantity, 1),
           COALESCE(NEW.total_amount, 0),
           COALESCE(NEW.status, 'PAID'),
           NEW.reserve_code,
           COALESCE(NEW.created_at, NOW()),
           NEW.payment_method
       )
RETURNING
    reserved_id           AS reservation_id,
    user_id,
    event_id,
    ticket_type_id,
    quantity,
    total_amount,
    payment_status        AS status,
    confirmation_code     AS reserve_code,
    registration_datetime AS created_at,
    payment_method;

-- reservation_tickets (VIEW) <-> reserved_seats (TABLE)
CREATE OR REPLACE VIEW reservation_tickets AS
SELECT
    r.reserved_id                                  AS reservation_id,
    COALESCE(r.ticket_type_id, ztt.ticket_type_id) AS ticket_type_id,
    sr.row_label                                   AS seat_row,
    s.seat_number                                  AS seat_col,
    COALESCE(tt.price, z.price, r.total_amount, 0) AS price,
    rs.reserved_seat_id                            AS reservation_ticket_id
FROM reserved r
         LEFT JOIN reserved_seats rs ON rs.reserved_id = r.reserved_id
         LEFT JOIN seats       s  ON s.seat_id = rs.seat_id
         LEFT JOIN seat_rows   sr ON sr.row_id = s.row_id
         LEFT JOIN seat_zones  z  ON z.zone_id = sr.zone_id
         LEFT JOIN zone_ticket_types ztt ON ztt.zone_id = z.zone_id
         LEFT JOIN ticket_types tt ON tt.ticket_type_id = COALESCE(r.ticket_type_id, ztt.ticket_type_id);

-- ===== Replace RULE with INSTEAD OF TRIGGER =====
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_rules
        WHERE schemaname = 'public'
          AND tablename  = 'reservation_tickets'
          AND rulename   = 'reservation_tickets_ins'
    ) THEN
        EXECUTE 'DROP RULE reservation_tickets_ins ON reservation_tickets';
END IF;
END $$;

-- ⭐ Trigger function แบบ ROBUST (fallback หา ticket_type_id จาก zone)
CREATE OR REPLACE FUNCTION reservation_tickets_ins_tf()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
v_ticket_type_id BIGINT;
    v_event_id       BIGINT;
BEGIN
    -- ถ้าไม่ได้ส่งตำแหน่งที่นั่ง ก็ไม่ต้องทำอะไร
    IF NEW.seat_row IS NULL OR NEW.seat_col IS NULL THEN
        RETURN NULL;
END IF;

    -- 1) หา ticket_type_id และ event_id จาก reserved (ลำดับ: NEW → reserved)
SELECT COALESCE(NEW.ticket_type_id, r.ticket_type_id), r.event_id
INTO v_ticket_type_id, v_event_id
FROM reserved r
WHERE r.reserved_id = NEW.reservation_id;

-- 2) ถ้ายังไม่มี ticket_type_id → พยายามหาจาก zone + seat_row
IF v_ticket_type_id IS NULL AND v_event_id IS NOT NULL THEN
SELECT ztt.ticket_type_id
INTO v_ticket_type_id
FROM seat_zones z
         JOIN seat_rows sr ON sr.zone_id = z.zone_id AND sr.row_label = NEW.seat_row
         JOIN zone_ticket_types ztt ON ztt.zone_id = z.zone_id
WHERE z.event_id = v_event_id
    LIMIT 1;
END IF;

    -- 3) ยังไม่มีให้ error
    IF v_ticket_type_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine ticket_type_id for reservation % (seat_row: %, seat_col: %)',
            NEW.reservation_id, NEW.seat_row, NEW.seat_col;
END IF;

    -- 4) Insert into reserved_seats (ล็อกโซนผ่าน zone_ticket_types)
INSERT INTO reserved_seats (reserved_id, seat_id)
SELECT NEW.reservation_id, s.seat_id
FROM ticket_types tt
         JOIN zone_ticket_types ztt ON ztt.ticket_type_id = tt.ticket_type_id
         JOIN seat_zones z ON z.zone_id = ztt.zone_id
         JOIN seat_rows sr ON sr.zone_id = z.zone_id AND sr.row_label = NEW.seat_row
         JOIN seats s ON s.row_id = sr.row_id AND s.seat_number = NEW.seat_col
WHERE tt.ticket_type_id = v_ticket_type_id
    LIMIT 1
ON CONFLICT (reserved_id, seat_id) DO NOTHING;

RETURN NULL;  -- INSTEAD OF trigger
END;
$$;

-- Bind trigger
DROP TRIGGER IF EXISTS trg_reservation_tickets_ins ON reservation_tickets;

CREATE TRIGGER trg_reservation_tickets_ins
    INSTEAD OF INSERT ON reservation_tickets
    FOR EACH ROW
    EXECUTE FUNCTION reservation_tickets_ins_tf();