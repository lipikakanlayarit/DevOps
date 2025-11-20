INSERT INTO seat_zones(zone_id, event_id, zone_name)
VALUES
    (10, 100, 'Zone A'),
    (11, 100, 'Zone B'),
    (20, 200, 'Zone C');   -- another event

INSERT INTO seat_rows(zone_id, row_label, sort_order, is_active, created_at, updated_at)
VALUES
    (10, 'A', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (10, 'B', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 'C', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (20, 'D', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
