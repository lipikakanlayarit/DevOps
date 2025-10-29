-- =========================================================
--  Recreate compatibility VIEW: reservation_tickets
--  - seat_col: TEXT (cast from seats.seat_number)
--  - add stable running number per reservation: reservation_ticket_id
--  Why: Postgres cannot alter column type in VIEW via CREATE OR REPLACE.
--       We must DROP the VIEW and CREATE it again.
-- =========================================================

BEGIN;

-- 1) Clean up any existing object with that name (VIEW first, then TABLE just in case)
DROP VIEW IF EXISTS reservation_tickets CASCADE;
DROP TABLE IF EXISTS reservation_tickets CASCADE;

-- 2) Recreate VIEW with seat_col as TEXT and add reservation_ticket_id
CREATE VIEW reservation_tickets AS
SELECT
    r.reserved_id                                  AS reservation_id,
    COALESCE(r.ticket_type_id, ztt.ticket_type_id) AS ticket_type_id,
    sr.row_label                                   AS seat_row,          -- TEXT already
    s.seat_number::text                            AS seat_col,          -- ✅ make TEXT
    COALESCE(tt.price, z.price, r.total_amount, 0) AS price,
    -- ✅ stable running number per reservation for ordering (1..N)
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

COMMIT;
