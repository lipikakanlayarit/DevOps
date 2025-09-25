-- V3__views.sql
-- View for seat status (AVAILABLE / HELD / SOLD)

CREATE OR REPLACE VIEW v_seat_status AS
SELECT
  e.event_id,
  z.zone_id, z.zone_name,
  r.row_id,  r.row_label,
  s.seat_id, s.seat_number, s.seat_label,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM reserved_seats rs
      JOIN reserved rsv ON rsv.reserved_id = rs.reserved_id AND rsv.event_id = e.event_id
      JOIN payments p   ON p.reserved_id  = rsv.reserved_id
      WHERE rs.seat_id = s.seat_id AND p.payment_status = 'SUCCESS'
    ) THEN 'SOLD'
    WHEN EXISTS (
      SELECT 1
      FROM seat_locks sl
      WHERE sl.seat_id = s.seat_id
        AND sl.event_id = e.event_id
        AND sl.status = 'HELD'
        AND sl.expires_at > CURRENT_TIMESTAMP
    ) THEN 'HELD'
    ELSE 'AVAILABLE'
  END AS seat_status
FROM events_nam e
JOIN seat_zones z ON z.event_id = e.event_id
JOIN seat_rows  r ON r.zone_id  = z.zone_id
JOIN seats      s ON s.row_id   = r.row_id;
