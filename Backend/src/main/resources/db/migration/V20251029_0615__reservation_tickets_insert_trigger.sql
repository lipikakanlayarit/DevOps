-- =========================================================
-- Enable INSERT into VIEW reservation_tickets via INSTEAD OF trigger
-- So seed script (R__butcon_seed_data.sql) can keep inserting into the VIEW.
-- It will translate each row to an insert into reserved_seats.
-- =========================================================

-- Safety: drop old trigger/function if exist
DROP TRIGGER IF EXISTS trg_reservation_tickets_ins ON reservation_tickets;
DROP FUNCTION IF EXISTS trg_reservation_tickets_ins_fn();

-- Create trigger function
CREATE FUNCTION trg_reservation_tickets_ins_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_seat_id BIGINT;
    v_seat_col_int INT;
BEGIN
    -- seat_col in the VIEW is TEXT, seed may pass number; cast robustly
    BEGIN
        v_seat_col_int := NEW.seat_col::int;
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'seat_col should be integer-like text, got: %', NEW.seat_col;
    END;

    -- find seat_id by row label + seat number
    SELECT s.seat_id
      INTO v_seat_id
      FROM seats s
      JOIN seat_rows sr ON sr.row_id = s.row_id
     WHERE sr.row_label = NEW.seat_row
       AND s.seat_number = v_seat_col_int
     LIMIT 1;

    IF v_seat_id IS NULL THEN
        RAISE EXCEPTION 'No seat found for row=% and col=%', NEW.seat_row, NEW.seat_col;
    END IF;

    -- ensure reservation exists (NEW.reservation_id comes from seed)
    IF NOT EXISTS (SELECT 1 FROM reserved r WHERE r.reserved_id = NEW.reservation_id) THEN
        RAISE EXCEPTION 'Reservation % does not exist', NEW.reservation_id;
    END IF;

    -- optionally ensure ticket_type matches reservation if you require strictness
    -- IF NEW.ticket_type_id IS NOT NULL AND
    --    NOT EXISTS (
    --        SELECT 1 FROM reserved r
    --        WHERE r.reserved_id = NEW.reservation_id
    --          AND COALESCE(r.ticket_type_id, NEW.ticket_type_id) = NEW.ticket_type_id
    --    )
    -- THEN
    --     RAISE EXCEPTION 'ticket_type mismatch for reservation %', NEW.reservation_id;
    -- END IF;

    -- insert link reservation <-> seat
    INSERT INTO reserved_seats (reserved_id, seat_id)
    VALUES (NEW.reservation_id, v_seat_id);

    -- price in VIEW is derived (COALESCE of tt/z/reservation), no write needed here

    -- INSTEAD OF trigger must return something; return NEW as if inserted
    RETURN NEW;
END;
$$;

-- Create the INSTEAD OF INSERT trigger on the VIEW
CREATE TRIGGER trg_reservation_tickets_ins
INSTEAD OF INSERT ON reservation_tickets
FOR EACH ROW
EXECUTE FUNCTION trg_reservation_tickets_ins_fn();
