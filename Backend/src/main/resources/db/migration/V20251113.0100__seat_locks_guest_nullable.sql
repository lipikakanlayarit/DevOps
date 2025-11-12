-- ทำให้ user_id ว่างได้ (รองรับ guest)
ALTER TABLE seat_locks
    ALTER COLUMN user_id DROP NOT NULL;

-- ลบ FK เดิม ถ้ามี
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seat_locks_user_id_fkey'
  ) THEN
ALTER TABLE seat_locks DROP CONSTRAINT seat_locks_user_id_fkey;
END IF;
END $$;

-- หา "ชื่อคอลัมน์" ของ Primary Key ในตาราง users แบบอัตโนมัติ แล้วค่อยสร้าง FK ใหม่
DO $$
DECLARE
pkcol text;
BEGIN
SELECT a.attname
INTO pkcol
FROM pg_index i
         JOIN pg_attribute a
              ON a.attrelid = i.indrelid
                  AND a.attnum   = ANY(i.indkey)
WHERE i.indrelid = 'users'::regclass
    AND i.indisprimary
  LIMIT 1;

IF pkcol IS NULL THEN
    RAISE EXCEPTION 'Primary key not found on table "users"';
END IF;

EXECUTE format(
        'ALTER TABLE seat_locks
           ADD CONSTRAINT seat_locks_user_id_fkey
           FOREIGN KEY (user_id) REFERENCES users(%I)
           ON DELETE SET NULL',
        pkcol
        );
END $$;
