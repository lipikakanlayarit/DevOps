-- V4__seed_data.sql
-- Sample seed data

-- USERS
INSERT INTO users (email, password_hash, first_name, last_name, phone_number, id_card_passport, username)
VALUES
 ('alice@example.com', 'hash_alice', 'Alice', 'Wong', '0812345678', '1234567890123', 'alice123') ON CONFLICT DO NOTHING,
 ('bob@example.com',   'hash_bob',   'Bob',   'Tan',  '0823456789', '9876543210123', 'bob456') ON CONFLICT DO NOTHING;

-- ORGANIZERS
INSERT INTO organizers (email, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status)
VALUES
 ('org1@butcon.com', 'hash_org1', 'Nina', 'Lee', '0834567890', 'Bangkok, TH', 'EventPro Ltd.',   'TAX123456', 'VERIFIED'),
 ('org2@butcon.com', 'hash_org2', 'John', 'Chan','0845678901', 'Chiang Mai, TH', 'ConcertHub Co.', 'TAX654321', 'VERIFIED')
ON CONFLICT DO NOTHING;

-- ADMINS
INSERT INTO admin_users (email, password_hash, first_name, last_name, role, is_active)
VALUES ('admin@butcon.com', 'hash_admin', 'System', 'Admin', 'SUPERADMIN', TRUE)
ON CONFLICT DO NOTHING;

-- CATEGORIES
INSERT INTO categories (category_name, description) VALUES
 ('Concert',  'Music concerts and live shows'),
 ('Seminar',  'Business and academic seminars'),
 ('Festival', 'Outdoor and cultural festivals')
ON CONFLICT DO NOTHING;

-- EVENTS
INSERT INTO events_nam (organizer_id, event_name, description, category_id, start_datetime, end_datetime, venue_name, venue_address, max_capacity, status) VALUES
 (1, 'BUTCON Music Fest 2025', 'Annual outdoor music festival', 1, TIMESTAMPTZ '2025-11-01 18:00:00+07', TIMESTAMPTZ '2025-11-01 23:59:59+07', 'Central Park', 'Bangkok, Thailand', 5000, 'PUBLISHED'),
 (2, 'Startup Seminar 2025',   'Seminar for startups and investors', 2, TIMESTAMPTZ '2025-10-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 17:00:00+07', 'Chiang Mai Conference Center', 'Chiang Mai, Thailand', 300, 'PUBLISHED')
ON CONFLICT DO NOTHING;

-- TICKET TYPES
INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold, sale_start_datetime, sale_end_datetime, is_active) VALUES
 (1, 'General Admission', 'Standard entry ticket', 1500.00, 3000, 100, TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE),
 (1, 'VIP',               'VIP access with perks', 5000.00,  500,  50, TIMESTAMPTZ '2025-09-01 10:00:00+07', TIMESTAMPTZ '2025-11-01 18:00:00+07', TRUE),
 (2, 'Seminar Pass',      'Full-day seminar pass', 1000.00,  200,  20, TIMESTAMPTZ '2025-08-15 09:00:00+07', TIMESTAMPTZ '2025-10-15 09:00:00+07', TRUE)
ON CONFLICT DO NOTHING;

-- RESERVED
INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes)
VALUES
 (1, 1, 1, 2, 3000.00, 'PAID',   'CONF123ABC', 'Excited to join!'),
 (2, 1, 2, 1, 5000.00, 'PENDING','CONF456DEF', 'Need invoice'),
 (1, 2, 3, 1, 1000.00, 'PAID',   'CONF789GHI', 'Business trip covered')
ON CONFLICT DO NOTHING;

-- PAYMENTS
INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response) VALUES
 (1, 3000.00, 'Credit Card',  'TXN123', 'SUCCESS', 'Approved by gateway'),
 (2, 5000.00, 'Bank Transfer','TXN456', 'PENDING', NULL),
 (3, 1000.00, 'E-Wallet',     'TXN789', 'SUCCESS', 'Wallet confirmed')
ON CONFLICT DO NOTHING;

-- SESSIONS
INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
 ('sess_org1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day', TRUE, '192.168.1.10', 'Mozilla/5.0')
ON CONFLICT DO NOTHING;

INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
 ('sess_user1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day', TRUE, '192.168.1.11', 'Mozilla/5.0'),
 ('sess_user2', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day', TRUE, '192.168.1.12', 'Chrome/120.0')
ON CONFLICT DO NOTHING;
