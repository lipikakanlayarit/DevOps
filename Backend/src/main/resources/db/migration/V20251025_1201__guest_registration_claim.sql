-- =========================================================
-- V20251025_1201__guest_registration_claim.sql
-- Add guest-registration linking on reserved + keep seed compat
-- =========================================================

ALTER TABLE reserved
    ADD COLUMN IF NOT EXISTS guest_email       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS guest_claimed_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_as_guest  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_reserved_guest_email_unclaimed
    ON reserved (guest_email)
    WHERE user_id IS NULL AND created_as_guest = TRUE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_reserved_guest_fields'
          AND conrelid = 'reserved'::regclass
    ) THEN
ALTER TABLE reserved
    ADD CONSTRAINT chk_reserved_guest_fields
        CHECK (
            (created_as_guest = TRUE AND user_id IS NULL AND guest_email IS NOT NULL)
                OR
            (created_as_guest = FALSE)
            ) NOT VALID;
END IF;
END $$;

DROP VIEW IF EXISTS reservations CASCADE;

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
    r.payment_method,
    r.guest_email,
    r.guest_claimed_at,
    r.created_as_guest
FROM reserved r;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_rules
        WHERE schemaname = 'public'
          AND tablename  = 'reservations'
          AND rulename   = 'reservations_ins'
    ) THEN
        EXECUTE 'DROP RULE reservations_ins ON reservations';
END IF;
END $$;

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
    payment_method,
    guest_email,
    guest_claimed_at,
    created_as_guest
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
    NEW.payment_method,
    NEW.guest_email,
    NEW.guest_claimed_at,
    COALESCE(NEW.created_as_guest, FALSE)
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
    payment_method,
    guest_email,
    guest_claimed_at,
    created_as_guest;
