-- =========================================================
--  V20251025_1200__init_base_schema.sql
--  INITIAL SCHEMA (no seed) - derived from butcon_postgres_INIT.sql
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
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE categories SET is_active = TRUE WHERE is_active IS NULL;

-- =================== EVENTS ===================
CREATE TABLE IF NOT EXISTS events_nam (
                                          event_id BIGSERIAL PRIMARY KEY,
                                          organizer_id BIGINT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    description VARCHAR(255),
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
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN event_id TYPE BIGINT';          EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN organizer_id TYPE BIGINT';      EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN category_id TYPE BIGINT';       EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN description TYPE VARCHAR(255)'; EXCEPTION WHEN others THEN NULL; END;
BEGIN EXECUTE 'ALTER TABLE events_nam ALTER COLUMN cover_image TYPE BYTEA';        EXCEPTION WHEN others THEN NULL; END;
END$$;

DO $$
BEGIN
BEGIN
EXECUTE 'ALTER TABLE events_nam ALTER COLUMN status SET DEFAULT ''PENDING''';
EXCEPTION WHEN others THEN NULL;
END;
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
    ADD CONSTRAINT events_status_check
        CHECK (UPPER(status) IN ('PENDING','APPROVED','REJECTED','PUBLISHED','UPCOMING'));

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

-- ✅ ปรับให้ไม่เกิด WARN/NOTICE เวลา migrate ซ้ำ ๆ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'ticket_types'::regclass
      AND attname  = 'created_at'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'ALTER TABLE ticket_types ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()';
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'ticket_types'::regclass
      AND attname  = 'updated_at'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'ALTER TABLE ticket_types ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()';
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'ticket_types'::regclass
      AND attname  = 'min_per_order'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'ALTER TABLE ticket_types ADD COLUMN min_per_order INT';
END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'ticket_types'::regclass
      AND attname  = 'max_per_order'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'ALTER TABLE ticket_types ADD COLUMN max_per_order INT';
END IF;
END
$$;

UPDATE ticket_types
SET created_at    = COALESCE(created_at, NOW()),
    updated_at    = COALESCE(updated_at, NOW()),
    min_per_order = COALESCE(min_per_order, 1),
    max_per_order = COALESCE(max_per_order, 1);

-- =================== RESERVED / PAYMENTS ===================
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
    ADD COLUMN IF NOT EXISTS payment_datetime TIMESTAMPTZ;

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
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status     VARCHAR(20)
    );

CREATE TABLE IF NOT EXISTS zone_ticket_types (
                                                 id BIGSERIAL PRIMARY KEY,
                                                 zone_id BIGINT REFERENCES seat_zones(zone_id) ON DELETE CASCADE,
    ticket_type_id BIGINT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
    );

-- =================== TRIGGERS ===================
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

-- =================== VIEWS ===================
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
