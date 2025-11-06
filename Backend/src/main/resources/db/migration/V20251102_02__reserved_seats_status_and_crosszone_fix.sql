-- ============================================
-- V20251102_02__reserved_seats_status_and_crosszone_fix.sql
-- Goal:
--   1) เพิ่มคอลัมน์ seat_status เพื่อควบคุมการกันที่นั่งแบบ Active-only
--   2) ทำ Partial UNIQUE INDEX เฉพาะสถานะ Active (LOCKED,PENDING,CONFIRMED)
--   3) คืนค่า View/Trigger reservation_tickets (INSERT ข้ามโซนได้ถูกต้อง)
--      โดยให้การ INSERT กำหนด seat_status = 'PENDING'
-- ============================================
BEGIN;

-- 0) เพิ่มคอลัมน์ seat_status (ถ้ายังไม่มี) + ใส่ constraint
DO $DDL$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reserved_seats' AND column_name='seat_status'
  ) THEN
    EXECUTE $SQL$
ALTER TABLE reserved_seats
    ADD COLUMN seat_status TEXT NOT NULL DEFAULT 'PENDING'
    $SQL$;
END IF;

  -- ใส่ CHECK constraint ให้รับเฉพาะค่าที่กำหนด (ถ้ายังไม่มี)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='reserved_seats' AND constraint_name='ck_reserved_seats_status'
  ) THEN
    EXECUTE $SQL$
ALTER TABLE reserved_seats
    ADD CONSTRAINT ck_reserved_seats_status
        CHECK (seat_status IN ('LOCKED','PENDING','CONFIRMED','CANCELLED','EXPIRED'))
    $SQL$;
END IF;
END
$DDL$;

-- 0.1) เติมค่าเดิมให้ปลอดภัย (แถวเก่าไม่มีค่า -> DEFAULT จะทำงานแล้ว แต่อัพเดตให้ชัด)
UPDATE reserved_seats
SET seat_status = COALESCE(seat_status, 'PENDING');

-- 0.2) unique ต่อ (reserved_id, seat_id) ภายในใบจองเดียวกัน (กันแถวซ้ำใน reservation เดียว)
DO $DDL$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='ux_reserved_seats_resv_seat'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_reserved_seats_resv_seat ON reserved_seats(reserved_id, seat_id)';
END IF;
END
$DDL$;

-- 1) Guard: unique index กันจองซ้ำเฉพาะสถานะ Active (LOCKED,PENDING,CONFIRMED)
--    หมายเหตุ: อนุญาตให้ที่นั่งเดียวกันถูกเลือกซ้ำได้ถ้าของเก่าเป็น CANCELLED/EXPIRED แล้ว
--    ใช้ partial unique index บน (seat_id)
DO $DDL$
BEGIN
  -- ลบ index เก่าชื่อเดิม (ถ้ามี)
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='ux_reserved_seats_active'
  ) THEN
    EXECUTE 'DROP INDEX ux_reserved_seats_active';
END IF;

  -- สร้างใหม่แบบ partial (Active statuses)
EXECUTE $SQL$
CREATE UNIQUE INDEX ux_reserved_seats_active
    ON reserved_seats (seat_id)
    WHERE seat_status IN ('LOCKED','PENDING','CONFIRMED')
  $SQL$;
END
$DDL$;

-- 2) ล้างของเดิม (VIEW / TRIGGER / FUNCTION / RULE) เผื่อเคยมี
DROP TRIGGER IF EXISTS trg_reservation_tickets_ins ON reservation_tickets;
DROP FUNCTION IF EXISTS reservation_tickets_ins_tf();
DROP FUNCTION IF EXISTS trg_reservation_tickets_ins_fn();
DO $CLEAN$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_rules
    WHERE schemaname='public' AND tablename='reservation_tickets' AND rulename='reservation_tickets_ins'
  ) THEN
    EXECUTE 'DROP RULE reservation_tickets_ins ON reservation_tickets';
END IF;
END
$CLEAN$;

-- 3) VIEW ใหม่ (เหมือนที่คุณส่งมา): seat_col เป็น TEXT + reservation_ticket_id (ROW_NUMBER)
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

-- 4) Trigger function (INSERT ลง reserved_seats + ตั้ง seat_status = ''PENDING'')
CREATE OR REPLACE FUNCTION reservation_tickets_ins_tf()
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

  -- NOTE:
  --   1) ใส่ seat_status = 'PENDING' ตอน insert ผ่าน view
  --   2) ปล่อยให้แอปอัพเดตเป็น LOCKED/CONFIRMED/CANCELLED/EXPIRED ตาม flow จริง
INSERT INTO reserved_seats (reserved_id, seat_id, seat_status)
SELECT NEW.reservation_id, s.seat_id, 'PENDING'
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

-- 5) bind trigger
CREATE TRIGGER trg_reservation_tickets_ins
    INSTEAD OF INSERT ON reservation_tickets
    FOR EACH ROW
    EXECUTE FUNCTION reservation_tickets_ins_tf();

COMMIT;
