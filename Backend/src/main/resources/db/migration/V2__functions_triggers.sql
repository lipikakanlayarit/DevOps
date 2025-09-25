-- V2__functions_triggers.sql
-- - updated_at auto-touch triggers
-- - payment success trigger to update ticket_types.quantity_sold

-- 1) generic function to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- apply to tables that have updated_at
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
           AND tablename IN ('users','organizers','admin_users','events_nam','ticket_types',
                              'seat_zones','seat_rows','seats')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
      CREATE TRIGGER trg_%I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ', r.tablename, r.tablename, r.tablename, r.tablename);
  END LOOP;
END$$;

-- 2) payment success trigger
CREATE OR REPLACE FUNCTION on_payment_success()
RETURNS TRIGGER AS $$
DECLARE
  v_qty INT;
  v_tt BIGINT;
BEGIN
  IF NEW.payment_status = 'SUCCESS' AND COALESCE(OLD.payment_status,'') <> 'SUCCESS' THEN
    SELECT r.quantity, r.ticket_type_id INTO v_qty, v_tt
    FROM reserved r
    WHERE r.reserved_id = NEW.reserved_id;

    UPDATE ticket_types
    SET quantity_sold = quantity_sold + COALESCE(v_qty,0)
    WHERE ticket_type_id = v_tt;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_payment_success ON payments;
CREATE TRIGGER trg_after_payment_success
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION on_payment_success();
