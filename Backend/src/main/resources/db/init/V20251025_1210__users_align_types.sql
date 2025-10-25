-- =========================================================
--  V20251025_1210__users_align_types.sql
--  Align column types for users as per Hibernate (DDL only)
-- =========================================================

ALTER TABLE users
ALTER COLUMN password_hash TYPE VARCHAR(255) USING substring(password_hash,1,255);

ALTER TABLE users
ALTER COLUMN phone_number TYPE VARCHAR(30);

ALTER TABLE users
ALTER COLUMN id_card_passport TYPE VARCHAR(30) USING substring(id_card_passport,1,30);

ALTER TABLE users
ALTER COLUMN roles TYPE VARCHAR(50);
