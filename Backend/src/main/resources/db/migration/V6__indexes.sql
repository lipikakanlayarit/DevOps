-- V6__indexes.sql
-- Additional helpful indexes + GIN full-text search equivalent

-- Full-text over (event_name, description) similar to MySQL FULLTEXT
CREATE INDEX IF NOT EXISTS idx_events_search
ON events_nam
USING GIN (to_tsvector('simple', coalesce(event_name,'') || ' ' || coalesce(description,'')));

-- Convenience partial index for active locks
CREATE INDEX IF NOT EXISTS idx_seat_locks_active
ON seat_locks (seat_id)
WHERE status = 'HELD'
