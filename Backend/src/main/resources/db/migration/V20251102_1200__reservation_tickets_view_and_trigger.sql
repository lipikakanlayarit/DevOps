-- =========================================================
-- Recreate VIEW + INSTEAD OF INSERT trigger for reservation_tickets
-- เพื่อให้ seed (R__butcon_seed_data.sql) ยัง INSERT ใส่ VIEW ได้
-- และ map ไปตาราง reserved_seats อย่างถูกต้อง
-- =========================================================

BEGIN;

-- 0) เก็บกวาดของเดิม (ถ้ามี)
DROP TRIGGER IF EXISTS trg_reservation_tickets_ins ON reservation_tickets;
DROP FUNCTION IF EXISTS reservation_tickets_ins_tf();
DROP FUNCTION IF EXISTS trg_reservation_tickets_ins_fn();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_rules
    WHERE schemaname = 'public'
      AND tablename  = 'reservation_tickets'
      AND rulename   = 'reservation_tickets_ins'
  ) THEN
    EXECUTE 'DROP RULE reservation_tickets_ins ON reservation_tickets';
  END IF;
END $$;

-- 1) สร้าง VIEW ใหม่ (seat_col เป็น TEXT และมี reservation_ticket_id เรียงคงที่)
DROP VIEW IF EXISTS reservation_tickets CASCADE;

CREATE VIEW reservation_tickets AS
SELECT
    r.reserved_id                                  AS reservation_id,
    COALESCE(r.ticket_type_id, ztt.ticket_type_id) AS ticket_type_id,
    sr.row_label                                   AS seat_row,          -- TEXT
    s.seat_number::text                            AS seat_col,          -- TEXT
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

-- 2) ฟังก์ชันทริกเกอร์: INSERT ใส่ VIEW แล้วไปแม็ป (seat_row, seat_col) -> seat_id
CREATE FUNCTION reservation_tickets_ins_tf()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_seat_col_int INT;
BEGIN
  -- ถ้าไม่ได้ส่งตำแหน่งที่นั่ง ก็ไม่ต้องทำอะไร
  IF NEW.seat_row IS NULL OR NEW.seat_col IS NULL THEN
    RETURN NULL;
  END IF;

  -- seat_col ใน VIEW เป็น TEXT → แปลงเป็น INT ให้ robust
  BEGIN
    v_seat_col_int := NEW.seat_col::int;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'seat_col should be an integer-like text, got: %', NEW.seat_col;
  END;

  -- map seat ไป zone ของ event เดียวกับ ticket_type (หรือของ reservation)
  INSERT INTO reserved_seats (reserved_id, seat_id)
  SELECT
      NEW.reservation_id,
      s.seat_id
  FROM reserved r
  JOIN ticket_types tt
    ON tt.ticket_type_id = COALESCE(r.ticket_type_id, NEW.ticket_type_id)
  JOIN seat_zones z
    ON z.event_id = tt.event_id
  JOIN seat_rows sr
    ON sr.zone_id   = z.zone_id
   AND sr.row_label = NEW.seat_row
  JOIN seats s
    ON s.row_id      = sr.row_id
   AND s.seat_number = v_seat_col_int
  WHERE r.reserved_id = NEW.reservation_id
  LIMIT 1
  ON CONFLICT (reserved_id, seat_id) DO NOTHING; -- กัน insert ซ้ำ

  -- INSTEAD OF trigger: RETURN NULL
  RETURN NULL;
END;
$$;

-- 3) ผูก INSTEAD OF INSERT trigger เข้ากับ VIEW
CREATE TRIGGER trg_reservation_tickets_ins
INSTEAD OF INSERT ON reservation_tickets
FOR EACH ROW
EXECUTE FUNCTION reservation_tickets_ins_tf();

COMMIT;
