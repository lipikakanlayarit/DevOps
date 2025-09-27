-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS
CREATE TABLE IF NOT EXISTS users (
                                     user_id SERIAL PRIMARY KEY,
                                     email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    id_card_passport VARCHAR(50),
    roles VARCHAR(20) NOT NULL
    );

-- ORGANIZERS
CREATE TABLE IF NOT EXISTS organizers (
                                          organizer_id SERIAL PRIMARY KEY,
                                          email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    company_name TEXT,
    tax_id VARCHAR(50),
    verification_status VARCHAR(20)
    );

-- ADMIN_USERS
CREATE TABLE IF NOT EXISTS admin_users (
                                           admin_id SERIAL PRIMARY KEY,
                                           email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
    );

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
                                          category_id SERIAL PRIMARY KEY,
                                          category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
    );

-- EVENTS
CREATE TABLE IF NOT EXISTS events_nam (
                                          event_id SERIAL PRIMARY KEY,
                                          organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    venue_name VARCHAR(200),
    venue_address TEXT,
    max_capacity INT,
    status VARCHAR(50)
    );

-- TICKET TYPES
CREATE TABLE IF NOT EXISTS ticket_types (
                                            ticket_type_id SERIAL PRIMARY KEY,
                                            event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    type_name VARCHAR(100),
    description TEXT,
    price NUMERIC(10,2),
    quantity_available INT,
    quantity_sold INT DEFAULT 0,
    sale_start_datetime TIMESTAMPTZ,
    sale_end_datetime TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
    );

-- RESERVED
CREATE TABLE IF NOT EXISTS reserved (
                                        reserved_id SERIAL PRIMARY KEY,
                                        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INT REFERENCES events_nam(event_id) ON DELETE CASCADE,
    ticket_type_id INT REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE,
    quantity INT,
    total_amount NUMERIC(10,2),
    payment_status VARCHAR(50),
    confirmation_code VARCHAR(100),
    notes TEXT
    );

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
                                        payment_id SERIAL PRIMARY KEY,
                                        reserved_id INT REFERENCES reserved(reserved_id) ON DELETE CASCADE,
    amount NUMERIC(10,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_status VARCHAR(50),
    gateway_response TEXT
    );

-- ORGANIZER SESSIONS
CREATE TABLE IF NOT EXISTS organizer_sessions (
                                                  session_id VARCHAR(100) PRIMARY KEY,
    organizer_id INT REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

-- USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
                                             session_id VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT
    );

-- ===================
-- SEED DATA
-- ===================

-- USERS
INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, id_card_passport, roles)
VALUES
    ('alice@example.com','alice123', crypt('password123', gen_salt('bf', 10)),'Alice','Wong','0812345678','1234567890123','USER'),
    ('admin@example.com','admin', crypt('password123', gen_salt('bf', 10)),'admin','user','0812345678','1234567890123','ADMIN'),
    ('organizer@example.com','organizer', crypt('password123', gen_salt('bf', 10)),'organizer','user','0812345678','1234567890123','ORGANIZER'),
    ('bob@example.com','bob456', crypt('password123', gen_salt('bf', 10)),'Bob','Tan','0823456789','9876543210123','USER')
    ON CONFLICT (email) DO NOTHING;

-- ORGANIZERS
INSERT INTO organizers (email, username, password_hash, first_name, last_name, phone_number, address, company_name, tax_id, verification_status)
VALUES
    ('org1@butcon.com','organizer', crypt('password123', gen_salt('bf', 10)), 'Nina','Lee','0834567890','Bangkok, TH','EventPro Ltd.','TAX123456','VERIFIED'),
    ('org2@butcon.com','organizer2', crypt('password123', gen_salt('bf', 10)), 'John','Chan','0845678901','Chiang Mai, TH','ConcertHub Co.','TAX654321','VERIFIED')
    ON CONFLICT (email) DO NOTHING;

-- ADMIN_USERS
INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role_name, is_active)
VALUES ('admin@butcon.com','admin', crypt('password123', gen_salt('bf', 10)), 'System','Admin','SUPERADMIN', TRUE)
    ON CONFLICT (email) DO NOTHING;

-- CATEGORIES
INSERT INTO categories (category_name, description) VALUES
                                                        ('Concert','Music concerts and live shows'),
                                                        ('Seminar','Business and academic seminars'),
                                                        ('Festival','Outdoor and cultural festivals')
    ON CONFLICT DO NOTHING;

-- EVENTS
INSERT INTO events_nam (organizer_id, event_name, description, category_id, start_datetime, end_datetime, venue_name, venue_address, max_capacity, status) VALUES
                                                                                                                                                               (1,'BUTCON Music Fest 2025','Annual outdoor music festival',1,TIMESTAMPTZ '2025-11-01 18:00:00+07',TIMESTAMPTZ '2025-11-01 23:59:59+07','Central Park','Bangkok, Thailand',5000,'PUBLISHED'),
                                                                                                                                                               (2,'Startup Seminar 2025','Seminar for startups and investors',2,TIMESTAMPTZ '2025-10-15 09:00:00+07',TIMESTAMPTZ '2025-10-15 17:00:00+07','Chiang Mai Conference Center','Chiang Mai, Thailand',300,'PUBLISHED')
    ON CONFLICT DO NOTHING;

-- TICKET TYPES
INSERT INTO ticket_types (event_id, type_name, description, price, quantity_available, quantity_sold, sale_start_datetime, sale_end_datetime, is_active) VALUES
                                                                                                                                                             (1,'General Admission','Standard entry ticket',1500.00,3000,100,TIMESTAMPTZ '2025-09-01 10:00:00+07',TIMESTAMPTZ '2025-11-01 18:00:00+07',TRUE),
                                                                                                                                                             (1,'VIP','VIP access with perks',5000.00,500,50,TIMESTAMPTZ '2025-09-01 10:00:00+07',TIMESTAMPTZ '2025-11-01 18:00:00+07',TRUE),
                                                                                                                                                             (2,'Seminar Pass','Full-day seminar pass',1000.00,200,20,TIMESTAMPTZ '2025-08-15 09:00:00+07',TIMESTAMPTZ '2025-10-15 09:00:00+07',TRUE)
    ON CONFLICT DO NOTHING;

-- RESERVED
INSERT INTO reserved (user_id, event_id, ticket_type_id, quantity, total_amount, payment_status, confirmation_code, notes) VALUES
                                                                                                                               (1,1,1,2,3000.00,'PAID','CONF123ABC','Excited to join!'),
                                                                                                                               (2,1,2,1,5000.00,'PENDING','CONF456DEF','Need invoice'),
                                                                                                                               (1,2,3,1,1000.00,'PAID','CONF789GHI','Business trip covered')
    ON CONFLICT DO NOTHING;

-- PAYMENTS
INSERT INTO payments (reserved_id, amount, payment_method, transaction_id, payment_status, gateway_response) VALUES
                                                                                                                 (1,3000.00,'Credit Card','TXN123','SUCCESS','Approved by gateway'),
                                                                                                                 (2,5000.00,'Bank Transfer','TXN456','PENDING',NULL),
                                                                                                                 (3,1000.00,'E-Wallet','TXN789','SUCCESS','Wallet confirmed')
    ON CONFLICT DO NOTHING;

-- ORGANIZER SESSIONS
INSERT INTO organizer_sessions (session_id, organizer_id, created_at, expires_at, is_active, ip_address, user_agent)
VALUES ('sess_org1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.10','Mozilla/5.0')
    ON CONFLICT DO NOTHING;

-- USER SESSIONS
INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, is_active, ip_address, user_agent) VALUES
                                                                                                               ('sess_user1',1,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.11','Mozilla/5.0'),
                                                                                                               ('sess_user2',2,NOW(),NOW() + INTERVAL '1 day',TRUE,'192.168.1.12','Chrome/120.0')
    ON CONFLICT DO NOTHING;
