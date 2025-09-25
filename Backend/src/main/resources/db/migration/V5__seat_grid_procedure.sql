-- V5__seat_grid_procedure.sql
-- index_to_letters() and create_zone_with_grid(...) for PostgreSQL

-- 1) index_to_letters: 0-based to Excel-like letters
CREATE OR REPLACE FUNCTION index_to_letters(n INT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s TEXT := '';
  x INT := n + 1;
  ch INT;
BEGIN
  IF n < 0 THEN
    RAISE EXCEPTION 'index_to_letters: n must be >= 0';
  END IF;
  WHILE x > 0 LOOP
    x := x - 1;
    ch := 65 + (x % 26);
    s := chr(ch) || s;
    x := x / 26;
  END LOOP;
  RETURN s;
END;
$$;

-- 2) create_zone_with_grid procedure (PostgreSQL 11+ supports PROCEDURE)
DO $$ BEGIN
  -- drop if exists (compat shim)
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE p.proname='create_zone_with_grid' AND n.nspname='public') THEN
    DROP PROCEDURE create_zone_with_grid(BIGINT, VARCHAR, INT, INT, BIGINT);
  END IF;
END $$;

CREATE PROCEDURE create_zone_with_grid(
  p_event_id BIGINT,
  p_zone_name VARCHAR,
  p_rows INT,
  p_seats_per_row INT,
  p_ticket_type_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_zone BIGINT;
  v_row_id BIGINT;
  r INT := 0;
  s INT;
  v_label TEXT;
BEGIN
  -- create zone
  INSERT INTO seat_zones (event_id, zone_name, description, sort_order, is_active)
  VALUES (p_event_id, p_zone_name, 'Auto generated ' || CURRENT_TIMESTAMP::text, 0, TRUE)
  RETURNING zone_id INTO v_zone;

  -- rows + seats
  WHILE r < p_rows LOOP
    v_label := index_to_letters(r);
    INSERT INTO seat_rows (zone_id, row_label, sort_order)
    VALUES (v_zone, v_label, r)
    RETURNING row_id INTO v_row_id;

    s := 1;
    WHILE s <= p_seats_per_row LOOP
      INSERT INTO seats (row_id, seat_number, seat_label, is_active)
      VALUES (v_row_id, s, v_label || s::text, TRUE);
      s := s + 1;
    END LOOP;

    r := r + 1;
  END LOOP;

  -- optional mapping
  IF p_ticket_type_id IS NOT NULL THEN
    INSERT INTO zone_ticket_types (zone_id, ticket_type_id)
    VALUES (v_zone, p_ticket_type_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
