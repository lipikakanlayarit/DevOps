-- ===== Fix cross-zone mapping for reservation_tickets INSERT =====
BEGIN;

-- 0) cleanup เดิม (ถ้ามี)
DROP TRIGGER IF EXISTS trg_reservation_tickets_ins ON reservation_tickets;
DROP FUNCTION IF EXISTS reservation_tickets_ins_tf();
DROP FUNCTION IF EXISTS trg_reservation_tickets_ins_fn();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_rules
    WHERE schemaname='public' AND tablename='reservation_tickets' AND rulename='reservation_tickets_ins'
  ) THEN
    EXECUTE 'DROP RULE reservation_tickets_ins ON reservation_tickets';
END IF;
END $$;

-- 1) VIEW ใหม่: seat_col เป็น TEXT + reservation_ticket_id (ROW_NUMBER)
DROP VIEW IF EXISTS reservation_tickets CASCADE;

CREATE VIEW reservation_tickets AS
SELECT
    r.reserved_id                                  AS reservation_id,
    COALESCE(r.ticket_type_id, ztt.ticket_type_id) AS ticket_type_id,
    sr.row_label                                   AS seat_row,
    s.seat_number::text                            AS seat_col,
    COALESCE(tt.price, z.price, r.total_amount, 0) AS price,
    ROW_NUMBER() OVER (
        PARTITION BY r.reserved_id
        ORDER BY sr.sort_order, s.seat_number, s.seat_id
    )                                              AS reservation_ticket_id
FROM reserved r
         LEFT JOIN reserved_seats    rs  ON rs.reserved_id = r.reserved_id
         LEFT JOIN seats             s   ON s.seat_id      = rs.seat_id
         LEFT JOIN seat_rows         sr  ON sr.row_id      = s.row_id
         LEFT JOIN seat_zones        z   ON z.zone_id      = sr.zone_id
         LEFT JOIN zone_ticket_types ztt ON ztt.zone_id    = z.zone_id
         LEFT JOIN ticket_types      tt  ON tt.ticket_type_id = COALESCE(r.ticket_type_id, ztt.ticket_type_id);

COMMENT ON VIEW reservation_tickets IS
'Compatibility view for reservation tickets; seat_col is TEXT and includes reservation_ticket_id (ROW_NUMBER within each reservation).';

-- 2) ทริกเกอร์ฟังก์ชัน: ล็อกโซนผ่าน zone_ticket_types และใช้ NEW.ticket_type_id ก่อน
CREATE FUNCTION reservation_tickets_ins_tf()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
v_ticket_type_id BIGINT;
  v_seat_col_int   INT;
BEGIN
  IF NEW.seat_row IS NULL OR NEW.seat_col IS NULL THEN
    RETURN NULL;
END IF;

BEGIN
    v_seat_col_int := NEW.seat_col::int;
EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'seat_col should be integer-like text, got: %', NEW.seat_col;
END;

SELECT COALESCE(NEW.ticket_type_id, r.ticket_type_id)
INTO v_ticket_type_id
FROM reserved r
WHERE r.reserved_id = NEW.reservation_id;

IF v_ticket_type_id IS NULL THEN
    RAISE EXCEPTION 'ticket_type_id is required (reservation %, seat %,%)',
      NEW.reservation_id, NEW.seat_row, NEW.seat_col;
END IF;

INSERT INTO reserved_seats (reserved_id, seat_id)
SELECT NEW.reservation_id, s.seat_id
FROM ticket_types tt
         JOIN zone_ticket_types ztt ON ztt.ticket_type_id = tt.ticket_type_id
         JOIN seat_zones z          ON z.zone_id = ztt.zone_id
         JOIN seat_rows  sr         ON sr.zone_id = z.zone_id AND sr.row_label = NEW.seat_row
         JOIN seats      s          ON s.row_id = sr.row_id AND s.seat_number = v_seat_col_int
WHERE tt.ticket_type_id = v_ticket_type_id
    LIMIT 1
ON CONFLICT (reserved_id, seat_id) DO NOTHING;

RETURN NULL;  -- INSTEAD OF trigger
END;
$$;

-- 3) bind trigger
CREATE TRIGGER trg_reservation_tickets_ins
    INSTEAD OF INSERT ON reservation_tickets
    FOR EACH ROW
    EXECUTE FUNCTION reservation_tickets_ins_tf();

COMMIT;
